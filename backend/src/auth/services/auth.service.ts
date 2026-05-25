import { Injectable, UnauthorizedException, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/services/prisma.service';
import { MailerService } from './mailer.service';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { VerificationService } from '../../verification/verification.service';
import { WhatsappService } from '../../whatsapp/whatsapp.service';
import * as crypto from 'crypto';

// Simple in-memory rate limiter for OTP attempts
const otpAttempts = new Map<string, { count: number; lastAttempt: number; lockedUntil?: number }>();
const MAX_OTP_ATTEMPTS = 5;
const OTP_LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes lockout
const OTP_WINDOW_MS = 10 * 60 * 1000;  // 10 minute window

// Rate limiter for login/register attempts
const loginAttempts = new Map<string, { count: number; firstAttempt: number }>();
const MAX_LOGIN_ATTEMPTS = 10;
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minute window

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailerService: MailerService,
    private readonly verificationService: VerificationService,
    private readonly configService: ConfigService,
    private readonly whatsappService: WhatsappService,
  ) {}

  private generateIdentityId(role: 'DNR' | 'VOL' | 'PTN'): string {
    const date = new Date();
    const yy = date.getFullYear().toString().substring(2);
    const mm = (date.getMonth() + 1).toString().padStart(2, '0');
    const dd = date.getDate().toString().padStart(2, '0');
    
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let randomStr = '';
    for (let i = 0; i < 4; i++) {
        randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return `W18-${role}-${yy}${mm}${dd}-${randomStr}`;
  }

  private checkLoginRateLimit(identifier: string) {
    const now = Date.now();
    const record = loginAttempts.get(identifier);

    if (record) {
      if (now - record.firstAttempt > LOGIN_WINDOW_MS) {
        // Window expired, reset
        loginAttempts.set(identifier, { count: 1, firstAttempt: now });
      } else if (record.count >= MAX_LOGIN_ATTEMPTS) {
        const minutesLeft = Math.ceil((LOGIN_WINDOW_MS - (now - record.firstAttempt)) / 60000);
        throw new HttpException(
          `Too many login attempts. Please try again in ${minutesLeft} minute(s).`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      } else {
        record.count++;
      }
    } else {
      loginAttempts.set(identifier, { count: 1, firstAttempt: now });
    }
  }

  private checkOtpRateLimit(identifier: string) {
    const now = Date.now();
    const record = otpAttempts.get(identifier);

    if (record) {
      // Check lockout
      if (record.lockedUntil && now < record.lockedUntil) {
        const minutesLeft = Math.ceil((record.lockedUntil - now) / 60000);
        throw new HttpException(
          `Account temporarily locked. Try again in ${minutesLeft} minute(s).`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      // Reset if window expired
      if (now - record.lastAttempt > OTP_WINDOW_MS) {
        otpAttempts.set(identifier, { count: 1, lastAttempt: now });
        return;
      }

      record.count++;
      record.lastAttempt = now;

      if (record.count > MAX_OTP_ATTEMPTS) {
        record.lockedUntil = now + OTP_LOCKOUT_MS;
        throw new HttpException(
          'Too many failed OTP attempts. Account locked for 15 minutes.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    } else {
      otpAttempts.set(identifier, { count: 1, lastAttempt: now });
    }
  }

  private resetOtpRateLimit(identifier: string) {
    otpAttempts.delete(identifier);
  }

  private validateEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  private validateMobile(mobile: string): boolean {
    // Accept Indian mobile numbers: +91XXXXXXXXXX or 10-digit number
    const mobileRegex = /^(\+91[\s-]?)?[6-9]\d{9}$/;
    return mobileRegex.test(mobile.replace(/[\s-]/g, ''));
  }

  private validatePasswordStrength(password: string): string | null {
    if (password.length < 8) return 'Password must be at least 8 characters long.';
    if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter.';
    if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter.';
    if (!/\d/.test(password)) return 'Password must contain at least one number.';
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return 'Password must contain at least one special character.';
    return null;
  }

  private sanitizeInput(input: string): string {
    return input.trim().replace(/[<>]/g, '');
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async hashOtp(otp: string): Promise<string> {
    return bcrypt.hash(otp, 8);
  }

  private async verifyOtpHash(otp: string, hash: string): Promise<boolean> {
    return bcrypt.compare(otp, hash);
  }

  /** Returns login result if email belongs to a DB admin, otherwise returns null (no throw). */
  async tryAdminLogin(email: string, password: string): Promise<Record<string, unknown> | null> {
    const normalizedEmail = this.sanitizeInput(email.toLowerCase());
    const dbAdmin = await (this.prisma as any).admin.findUnique({ where: { email: normalizedEmail } });
    if (!dbAdmin) return null;

    if (!dbAdmin.isActive) return { error: 'This admin account has been deactivated.', statusCode: 401 };

    const passwordValid = await bcrypt.compare(password, dbAdmin.password as string);
    if (!passwordValid) return { error: 'Invalid admin credentials.', statusCode: 401 };

    console.log(`[AuthService] State admin login successful for ${normalizedEmail} (state: ${dbAdmin.state as string})`);

    const payload = {
      sub: dbAdmin.id,
      email: dbAdmin.email,
      role: dbAdmin.role as string,
      state: dbAdmin.state as string | null,
      name: dbAdmin.name as string,
    };
    const token = this.jwtService.sign(payload);

    return {
      success: true,
      token,
      name: dbAdmin.name,
      role: dbAdmin.role,
      state: dbAdmin.state,
      redirect: '/admin/dashboard',
      otpSent: false,
    };
  }

  /** Returns login result if email belongs to a camp organizer, otherwise returns null (no throw). */
  async tryCampOrganizerLogin(email: string, password: string): Promise<Record<string, unknown> | null> {
    const normalizedEmail = this.sanitizeInput(email.toLowerCase());
    const organizer = await (this.prisma as any).campOrganizer.findUnique({ where: { email: normalizedEmail } });
    if (!organizer) return null;

    if (!organizer.isActive) return { error: 'This account has been deactivated.', statusCode: 401 };

    if (organizer.accessExpiresAt && new Date() > new Date(organizer.accessExpiresAt as Date)) {
      return { error: 'Camp organizer access has expired.', statusCode: 401 };
    }

    const passwordValid = await bcrypt.compare(password, organizer.password as string);
    if (!passwordValid) return null; // wrong password — fall through to donor login

    await (this.prisma as any).campOrganizer.update({
      where: { id: organizer.id },
      data: { lastLoginAt: new Date() },
    });

    console.log(`[AuthService] Camp organizer login successful for ${normalizedEmail}`);

    const payload = {
      sub: organizer.id,
      email: organizer.email,
      role: 'CAMP_ORGANIZER',
      campId: organizer.campId,
      hasChangedPassword: organizer.hasChangedPassword,
    };
    const token = this.jwtService.sign(payload);

    return {
      success: true,
      token,
      name: organizer.name,
      role: 'CAMP_ORGANIZER',
      campId: organizer.campId,
      hasChangedPassword: organizer.hasChangedPassword,
      redirect: organizer.hasChangedPassword
        ? `/organizer/camp/${organizer.campId as string}`
        : '/organizer/set-password',
      otpSent: false,
    };
  }

  //Super Admin Login (DB state admins + env-based super admin fallback)

  async adminLogin(email: string, password: string) {
    email = this.sanitizeInput(email.toLowerCase());
    this.checkLoginRateLimit(`admin:${email}`);

    // 1. Check DB for a STATE_ADMIN account first
    const dbAdmin = await (this.prisma as any).admin.findUnique({ where: { email } });
    if (dbAdmin) {
      if (!dbAdmin.isActive) {
        throw new UnauthorizedException('This admin account has been deactivated.');
      }
      const passwordValid = await bcrypt.compare(password, dbAdmin.password);
      if (!passwordValid) {
        throw new UnauthorizedException('Invalid admin credentials.');
      }

      console.log(`[AuthService] State admin login successful for ${email} (state: ${dbAdmin.state})`);

      const payload = {
        sub: dbAdmin.id,
        email: dbAdmin.email,
        role: dbAdmin.role as string,   // "STATE_ADMIN"
        state: dbAdmin.state as string | null,
        name: dbAdmin.name as string,
      };
      const token = this.jwtService.sign(payload);

      return {
        success: true,
        token,
        name: dbAdmin.name,
        role: dbAdmin.role,
        state: dbAdmin.state,
        redirect: '/admin/dashboard',
        otpSent: false,
      };
    }

    // 2. Fall back to env-based super admin
    const adminEmail = this.configService.get<string>('ADMIN_EMAIL')?.toLowerCase();
    const adminPassword = this.configService.get<string>('ADMIN_PASSWORD');

    if (!adminEmail || !adminPassword) {
      throw new BadRequestException('Admin credentials not configured.');
    }

    if (email !== adminEmail) {
      throw new UnauthorizedException('Invalid admin credentials.');
    }

    if (password !== adminPassword) {
      throw new UnauthorizedException('Invalid admin credentials.');
    }

    console.log(`[AuthService] Super admin login successful for ${email}`);

    const payload = { sub: 'super-admin', email, role: 'SUPER_ADMIN', state: null, name: 'Super Admin' };
    const token = this.jwtService.sign(payload);

    return {
      success: true,
      token,
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
      state: null,
      redirect: '/admin/dashboard',
      otpSent: false,
    };
  }

  /** Camp Organizer login — validates isActive and accessExpiresAt */
  async campOrganizerLogin(email: string, password: string) {
    email = this.sanitizeInput(email.toLowerCase());
    this.checkLoginRateLimit(`organizer:${email}`);

    const organizer = await (this.prisma as any).campOrganizer.findUnique({ where: { email } });
    if (!organizer) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    if (!organizer.isActive) {
      throw new UnauthorizedException('This account has been deactivated.');
    }

    if (organizer.accessExpiresAt && new Date() > new Date(organizer.accessExpiresAt as Date)) {
      throw new UnauthorizedException('Camp organizer access has expired.');
    }

    const passwordValid = await bcrypt.compare(password, organizer.password as string);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    await (this.prisma as any).campOrganizer.update({
      where: { id: organizer.id },
      data: { lastLoginAt: new Date() },
    });

    console.log(`[AuthService] Camp organizer login successful for ${email}`);

    const payload = {
      sub: organizer.id,
      email: organizer.email,
      role: 'CAMP_ORGANIZER',
      campId: organizer.campId,
      hasChangedPassword: organizer.hasChangedPassword,
    };
    const token = this.jwtService.sign(payload);

    return {
      success: true,
      token,
      name: organizer.name,
      role: 'CAMP_ORGANIZER',
      campId: organizer.campId,
      hasChangedPassword: organizer.hasChangedPassword,
      redirect: organizer.hasChangedPassword ? `/organizer/camp/${organizer.campId as string}` : '/organizer/set-password',
      otpSent: false,
    };
  }

  //Login (existing users with password)

  async donorLogin(identifier: string, flags?: { 
    isVolunteer?: boolean; 
    isNonDonor?: boolean; 
    name?: string; 
    mobile?: string; 
    password?: string; 
    referredById?: string 
  }) {
    identifier = this.sanitizeInput(identifier.toLowerCase());
    console.log(`[AuthService] Login attempt for: ${identifier}`);
    
    this.checkLoginRateLimit(identifier);

    // Find donor by email OR donorId
    const donor = await this.prisma.donor.findFirst({
      where: {
        OR: [
          { email: identifier },
          { donorId: identifier },
        ],
      },
    });

    if (!donor) {
      // Don't reveal whether the account exists
      throw new BadRequestException('No account found with these credentials. Please register first.');
    }

    // Password-based login for existing users
    if (!donor.password) {
      throw new BadRequestException('No password set for this account. Please contact support or register again.');
    }

    if (!flags?.password) {
      throw new BadRequestException('Password is required to sign in.');
    }

    const isPasswordValid = await bcrypt.compare(flags.password, donor.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials. Please check your email/ID and password.');
    }

    console.log(`[AuthService] Password verified for ${donor.donorId}`);

    const isVolunteer = donor.isVolunteer || ('volunteerId' in donor && !!donor.volunteerId);
    if (isVolunteer) {
      const payload = { sub: donor.id, email: donor.email, donorId: donor.donorId };
      const token = this.jwtService.sign(payload);
      const volRecord = await this.prisma.volunteer.findFirst({ where: { donorId: donor.id } });
      const volunteerId = volRecord ? volRecord.volunteerId : undefined;
      const profileCompleted = !!volRecord?.city && !!volRecord?.profession;
      
      // Update emailVerified since password is correct
      await this.prisma.donor.update({
        where: { id: donor.id },
        data: { emailVerified: true }
      });
      
      return {
        success: true,
        token,
        name: donor.name,
        donorId: donor.donorId,
        volunteerId,
        eligible: donor.totalDonated ? donor.totalDonated >= 5000 : false,
        tier: donor.tier,
        isVolunteer: true,
        profileCompleted,
        role: 'VOLUNTEER',
        redirect: profileCompleted ? `/volunteer/${volunteerId || donor.donorId}/dashboard` : `/volunteer-onboarding`,
        otpSent: false,
      };
    }

    // 2FA Check
    // @ts-ignore
    if (donor.twoFactorEnabled) {
      const emailOtp = this.generateOtp();
      const emailOtpHash = await this.hashOtp(emailOtp);
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

      await this.prisma.donor.update({
        where: { id: donor.id },
        data: { emailOtpHash, otpExpiry },
      });

      await this.mailerService.sendOtpEmail(donor.email, emailOtp);

      const debugOtp = this.configService.get<string>('DEBUG_OTP') === 'true';
      const isProduction = this.configService.get<string>('NODE_ENV') === 'production';

      return {
        success: true,
        otpSent: true,
        twoFactorPending: true,
        donorId: donor.donorId,
        message: 'Two-factor authentication is enabled. Please enter the OTP sent to your email.',
        ...(!isProduction && debugOtp ? { devOtp: emailOtp } : {}),
      };
    }

    // Direct login for donors - no OTP required (OTP only during registration or if 2FA enabled)
    const payload = { 
      sub: donor.id, 
      email: donor.email, 
      donorId: donor.donorId,
      // @ts-ignore
      tokenVersion: (donor as any).tokenVersion || 0 
    };
    const token = this.jwtService.sign(payload);

    // Mark email as verified since password is correct
    await this.prisma.donor.update({
      where: { id: donor.id },
      data: { emailVerified: true },
    });

    console.log(`[AuthService] Direct login issued for donor ${donor.donorId}`);

    return {
      success: true,
      token,
      name: donor.name,
      donorId: donor.donorId,
      eligible: donor.totalDonated ? donor.totalDonated >= 5000 : false,
      tier: donor.tier,
      isVolunteer: false,
      role: 'DONOR',
      redirect: `/donor/${donor.donorId}/dashboard`,
      otpSent: false,
    };
  }

  //Register (new users)

  async donorRegister(data: {
    email: string;
    password: string;
    name: string;
    mobile?: string;
    isVolunteer?: boolean;
    isNonDonor?: boolean;
    referredById?: string;
  }) {
    // Sanitize inputs
    const email = this.sanitizeInput(data.email.toLowerCase());
    const name = this.sanitizeInput(data.name);
    const mobile = data.mobile ? this.sanitizeInput(data.mobile) : undefined;

    console.log(`[AuthService] Registration attempt for: ${email}`);

    this.checkLoginRateLimit(email);

    // Validate email format
    if (!this.validateEmail(email)) {
      throw new BadRequestException('Please provide a valid email address.');
    }

    // Validate name
    if (!name || name.length < 2) {
      throw new BadRequestException('Full name must be at least 2 characters.');
    }
    if (name.length > 100) {
      throw new BadRequestException('Name is too long (max 100 characters).');
    }

    // Validate mobile if provided
    if (mobile && !this.validateMobile(mobile)) {
      throw new BadRequestException('Please provide a valid Indian mobile number (e.g. +91 9876543210).');
    }

    // Validate password strength
    const passwordError = this.validatePasswordStrength(data.password);
    if (passwordError) {
      throw new BadRequestException(passwordError);
    }

    // Check if email already exists
    const existingDonor = await this.prisma.donor.findUnique({
      where: { email },
    });

    let donorRecordId: string | null = null;
    let isGuestClaim = false;

    if (existingDonor) {
      if (!existingDonor.password && !existingDonor.emailVerified) {
        // This is an unverified guest donor from a previous guest checkout. We can "claim" it.
        donorRecordId = existingDonor.id;
        isGuestClaim = true;
      } else {
        throw new BadRequestException('An account with this email already exists. Please sign in instead.');
      }
    }

    // Generate robust ID
    const newDonorId = this.generateIdentityId('DNR');

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Create or claim donor
    let donor;
    if (isGuestClaim && donorRecordId) {
      donor = await this.prisma.donor.update({
        where: { id: donorRecordId },
        data: {
          name,
          mobile: mobile || null,
          password: hashedPassword,
          isVolunteer: data.isVolunteer ?? false,
          isNonDonor: data.isNonDonor ?? false,
          ...(data.referredById ? { referredById: data.referredById } : {}),
        },
      });
    } else {
      donor = await this.prisma.donor.create({
        data: {
          email,
          donorId: newDonorId,
          name,
          mobile: mobile || null,
          password: hashedPassword,
          isVolunteer: data.isVolunteer ?? false,
          isNonDonor: data.isNonDonor ?? false,
          ...(data.referredById ? { referredById: data.referredById } : {}),
        },
      });
    }

    // Generate and send OTP for dual verification
    const emailOtp = this.generateOtp();
    const emailOtpHash = await this.hashOtp(emailOtp);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    let mobileOtp: string | null = null;
    let mobileOtpHash: string | null = null;
    if (mobile) {
      mobileOtp = this.generateOtp();
      mobileOtpHash = await this.hashOtp(mobileOtp);
    }

    await this.prisma.donor.update({
      where: { id: donor.id },
      data: { emailOtpHash, mobileOtpHash, otpExpiry, otpHash: null },
    });

    if (data.isVolunteer) {
      const newVolunteerId = this.generateIdentityId('VOL');
      
      await this.prisma.volunteer.create({
        data: {
          volunteerId: newVolunteerId,
          donorId: donor.id,
          email: email,
          name: name,
          mobile: mobile || '',
          emailOtpHash,
          mobileOtpHash,
        }
      });
    }

    await this.mailerService.sendOtpEmail(email, emailOtp);
    if (mobile && mobileOtp) {
      await this.verificationService.sendMobileOtp(mobile, mobileOtp);
    }

    const debugOtp = this.configService.get<string>('DEBUG_OTP') === 'true';
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';

    return {
      success: true,
      otpSent: true,
      donorId: donor.donorId,
      requiresMobileOtp: !!mobileOtp,
      message: 'Account created successfully! Please verify your email and mobile with the OTPs sent.',
      ...(!isProduction && debugOtp ? { devOtp: emailOtp, devMobileOtp: mobileOtp } : {}),
    };
  }

  //Resend OTP
  async resendOtp(identifier: string) {
    identifier = this.sanitizeInput(identifier.toLowerCase());
    
    this.checkLoginRateLimit(`resend:${identifier}`);

    const donor = await this.prisma.donor.findFirst({
      where: {
        OR: [
          { email: identifier },
          { donorId: identifier },
        ],
      },
    });

    if (!donor) {
      throw new BadRequestException('No account found with this email.');
    }

    const emailOtp = this.generateOtp();
    const emailOtpHash = await this.hashOtp(emailOtp);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    
    let mobileOtp: string | null = null;
    let mobileOtpHash: string | null = null;
    if (donor.mobile) {
      mobileOtp = this.generateOtp();
      mobileOtpHash = await this.hashOtp(mobileOtp);
    }

    await this.prisma.donor.update({
      where: { id: donor.id },
      data: { emailOtpHash, mobileOtpHash, otpExpiry, otpHash: null },
    });

    await this.mailerService.sendOtpEmail(donor.email, emailOtp);
    if (donor.mobile && mobileOtp) {
      await this.verificationService.sendMobileOtp(donor.mobile, mobileOtp);
    }

    const debugOtp = this.configService.get<string>('DEBUG_OTP') === 'true';
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';

    return {
      success: true,
      requiresMobileOtp: !!mobileOtp,
      message: 'New OTPs have been sent to your email and mobile.',
      ...(!isProduction && debugOtp ? { devOtp: emailOtp, devMobileOtp: mobileOtp } : {}),
    };
  }

  //Verify OTP
  async verifyOtp(identifier: string, otp: string) {
    identifier = this.sanitizeInput(identifier.toLowerCase());
    otp = this.sanitizeInput(otp);

    // Rate limit OTP verification attempts
    this.checkOtpRateLimit(identifier);

    // Validate OTP format
    if (!/^\d{6}$/.test(otp)) {
      throw new BadRequestException('OTP must be exactly 6 digits.');
    }

    const donor = await this.prisma.donor.findFirst({
      where: {
        OR: [
          { email: identifier },
          { donorId: identifier },
        ],
      },
    });

    if (!donor || (!donor.otpHash && !donor.emailOtpHash) || !donor.otpExpiry) {
      throw new BadRequestException('No OTP request found. Please request a new OTP.');
    }

    if (new Date() > donor.otpExpiry) {
      // Clear expired OTP
      await this.prisma.donor.update({
        where: { id: donor.id },
        data: { otpHash: null, emailOtpHash: null, mobileOtpHash: null, otpExpiry: null },
      });
      throw new BadRequestException('OTP has expired. Please request a new one.');
    }

    // Verify OTP hash (no backdoor!)
    const targetHash = donor.emailOtpHash || donor.otpHash;
    const isValid = await this.verifyOtpHash(otp, targetHash!);
    if (!isValid) {
      throw new UnauthorizedException('Invalid OTP. Please check and try again.');
    }

    // Check if this is the first verification (for welcome email)
    const wasAlreadyVerified = donor.emailVerified === true;

    // Clear OTP after successful verification & reset rate limiter
    await this.prisma.donor.update({
      where: { id: donor.id },
      data: { otpHash: null, emailOtpHash: null, mobileOtpHash: null, otpExpiry: null, emailVerified: true },
    });
    this.resetOtpRateLimit(identifier);

    const payload = { sub: donor.id, email: donor.email, donorId: donor.donorId };
    const token = this.jwtService.sign(payload);

    const isVolunteer = donor.isVolunteer || ('volunteerId' in donor && !!donor.volunteerId);
    const role = isVolunteer ? 'VOLUNTEER' : 'DONOR';

    let volunteerId: string | undefined;
    let profileCompleted = false;
    if (isVolunteer) {
      const volRecord = await this.prisma.volunteer.findFirst({ where: { donorId: donor.id } });
      if (volRecord) {
        volunteerId = volRecord.volunteerId;
        profileCompleted = !!volRecord.city && !!volRecord.profession;
      }
    }

    // Send welcome email + WhatsApp on first-time verification (fire-and-forget)
    if (!wasAlreadyVerified) {
      if (isVolunteer) {
        this.mailerService.sendWelcomeVolunteerEmail({
          email: donor.email,
          name: donor.name || 'Volunteer',
          donorId: donor.donorId,
          volunteerId,
        }).catch((err) => console.error('[WELCOME EMAIL ERROR] Volunteer:', err.message));

        // WhatsApp welcome (fire-and-forget)
        if (donor.mobile) {
          this.whatsappService.sendWelcomeVolunteer(donor.mobile, donor.name || 'Volunteer');
        }
      } else {
        this.mailerService.sendWelcomeDonorEmail({
          email: donor.email,
          name: donor.name || 'Donor',
          donorId: donor.donorId,
        }).catch((err) => console.error('[WELCOME EMAIL ERROR] Donor:', err.message));

        // WhatsApp welcome (fire-and-forget)
        if (donor.mobile) {
          this.whatsappService.sendWelcomeDonor(donor.mobile, donor.name || 'Donor');
        }
      }
    }

    return {
      success: true,
      token,
      name: donor.name,
      mobile: donor.mobile,
      donorId: donor.donorId,
      volunteerId,
      eligible: donor.totalDonated ? donor.totalDonated >= 5000 : false,
      tier: donor.tier,
      isVolunteer,
      profileCompleted,
      role: isVolunteer ? 'VOLUNTEER' : 'DONOR',
      redirect: isVolunteer 
        ? (profileCompleted ? `/volunteer/${volunteerId || donor.donorId}/dashboard` : `/volunteer-onboarding`)
        : `/donor/${donor.donorId}/dashboard`,
    };
  }

  //Verify Dual OTP
  
  async verifyDualOtp(identifier: string, emailOtp: string, mobileOtp?: string) {
    identifier = this.sanitizeInput(identifier.toLowerCase());
    emailOtp = this.sanitizeInput(emailOtp);
    if (mobileOtp) mobileOtp = this.sanitizeInput(mobileOtp);

    this.checkOtpRateLimit(identifier);

    if (!/^\d{6}$/.test(emailOtp)) {
      throw new BadRequestException('Email OTP must be exactly 6 digits.');
    }
    if (mobileOtp && !/^\d{6}$/.test(mobileOtp)) {
      throw new BadRequestException('Mobile OTP must be exactly 6 digits.');
    }

    let userFoundInModel: 'DONOR' | 'PARTNER' = 'DONOR';
    let userType: 'DONOR' | 'VOLUNTEER' | 'PARTNER' = 'DONOR';
    let user: any = await this.prisma.partner.findUnique({ where: { email: identifier } });
    if (user) {
      userType = 'PARTNER';
      userFoundInModel = 'PARTNER';
    } else {
      user = await this.prisma.donor.findFirst({
        where: { OR: [{ email: identifier }, { donorId: identifier }] },
      });
      if (!user) throw new BadRequestException('No OTP request found for this identity.');
      
      userFoundInModel = 'DONOR';
      
      if (user.isVolunteer) {
        userType = 'VOLUNTEER';
        // Fetch volunteerId so it can be passed into the JWT token
        const volRecord = await this.prisma.volunteer.findFirst({ where: { donorId: user.id } });
        if (volRecord) {
           user.volunteerId = volRecord.volunteerId;
        }
      }
    }

    if (!user.emailOtpHash && !user.otpHash) {
      throw new BadRequestException('No OTP request found. Please request a new OTP.');
    }
    
    // For legacy fallback, use otpHash if emailOtpHash isn't set yet
    const targetEmailHash = user.emailOtpHash || user.otpHash;

    if (user.otpExpiry && new Date() > user.otpExpiry) {
      // Clear expired OTP
      if (userType === 'PARTNER') {
        await this.prisma.partner.update({ where: { id: user.id }, data: { emailOtpHash: null, mobileOtpHash: null } });
      } else if (userType === 'VOLUNTEER') {
        await this.prisma.volunteer.update({ where: { id: user.id }, data: { emailOtpHash: null, mobileOtpHash: null } });
      } else {
        await this.prisma.donor.update({ where: { id: user.id }, data: { otpHash: null, emailOtpHash: null, mobileOtpHash: null, otpExpiry: null } });
      }
      throw new BadRequestException('OTP has expired. Please request a new one.');
    }

    // Verify Email OTP
    const isEmailValid = await this.verifyOtpHash(emailOtp, targetEmailHash!);
    if (!isEmailValid) {
      throw new UnauthorizedException('Invalid Email OTP.');
    }

    // Verify Mobile OTP if provided and required
    if (mobileOtp && user.mobileOtpHash) {
      const isMobileValid = await this.verifyOtpHash(mobileOtp, user.mobileOtpHash);
      if (!isMobileValid) {
        throw new UnauthorizedException('Invalid Mobile SMS OTP.');
      }
    }

    // Check if this is the first-time verification (for welcome email)
    const wasAlreadyVerified = user.emailVerified === true;

    // Mark as verified
    const updateData = { 
       otpHash: null, 
       emailOtpHash: null, 
       mobileOtpHash: null, 
       otpExpiry: null,
       emailVerified: true,
       ...(mobileOtp ? { mobileVerified: true } : {})
    };

    if (userFoundInModel === 'PARTNER') {
      const { otpHash, otpExpiry, ...partnerData } = updateData;
      await this.prisma.partner.update({ where: { id: user.id }, data: partnerData });
    } else {
      await this.prisma.donor.update({ where: { id: user.id }, data: updateData });
    }

    this.resetOtpRateLimit(identifier);

    const payload = { 
      sub: user.id, 
      email: user.email, 
      identityId: user.partnerId || user.volunteerId || user.donorId 
    };
    
    const token = this.jwtService.sign(payload);

    let profileCompleted = false;
    if (userType === 'VOLUNTEER') {
      const volRecord = await this.prisma.volunteer.findFirst({ where: { donorId: user.id } });
      profileCompleted = !!volRecord?.city && !!volRecord?.profession;
    }

    // Send role-specific welcome email + WhatsApp on first-time verification (fire-and-forget)
    if (!wasAlreadyVerified) {
      if (userType === 'PARTNER') {
        this.mailerService.sendWelcomePartnerEmail({
          email: user.email,
          contactPerson: user.contactPerson || user.name || 'Partner',
          organizationName: user.organizationName || 'Your Organization',
          partnerId: user.partnerId,
        }).catch((err) => console.error('[WELCOME EMAIL ERROR] Partner:', err.message));

        // WhatsApp welcome (fire-and-forget)
        if (user.mobile) {
          this.whatsappService.sendWelcomePartner(user.mobile, user.contactPerson || user.name || 'Partner');
        }
      } else if (userType === 'VOLUNTEER') {
        this.mailerService.sendWelcomeVolunteerEmail({
          email: user.email,
          name: user.name || 'Volunteer',
          donorId: user.donorId,
          volunteerId: user.volunteerId,
        }).catch((err) => console.error('[WELCOME EMAIL ERROR] Volunteer:', err.message));

        // WhatsApp welcome (fire-and-forget)
        if (user.mobile) {
          this.whatsappService.sendWelcomeVolunteer(user.mobile, user.name || 'Volunteer');
        }
      } else {
        this.mailerService.sendWelcomeDonorEmail({
          email: user.email,
          name: user.name || 'Donor',
          donorId: user.donorId,
        }).catch((err) => console.error('[WELCOME EMAIL ERROR] Donor:', err.message));

        // WhatsApp welcome (fire-and-forget)
        if (user.mobile) {
          this.whatsappService.sendWelcomeDonor(user.mobile, user.name || 'Donor');
        }
      }
    }

    return {
      success: true,
      token,
      name: user.name || user.contactPerson || "User",
      mobile: user.mobile,
      donorId: user.donorId || user.partnerId,
      volunteerId: user.volunteerId || undefined,
      partnerId: user.partnerId || undefined,
      eligible: userType === 'DONOR' ? user.totalDonated >= 5000 : true,
      tier: userType === 'DONOR' ? user.tier : undefined,
      profileCompleted,
      role: userType,
    };
  }

  //Advanced Security Methods

  async forgotPassword(email: string, type: 'DONOR' | 'PARTNER' | 'VOLUNTEER') {
    email = this.sanitizeInput(email.toLowerCase());
    
    let user;
    if (type === 'PARTNER') {
      user = await this.prisma.partner.findUnique({ where: { email } });
      if (!user) {
        throw new BadRequestException('No partner account found with this institutional email.');
      }
    } else {
      // For both DONOR and VOLUNTEER, we use the Donor model
      user = await this.prisma.donor.findUnique({ where: { email } });
      
      if (!user) {
        throw new BadRequestException(`No ${type.toLowerCase()} account found with this email. Please register first.`);
      }

      if (type === 'VOLUNTEER' && !user.isVolunteer) {
        throw new BadRequestException('This email is registered as a donor, but not as a volunteer. Please log in as a donor.');
      }
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour

    if (type === 'PARTNER') {
      await this.prisma.partner.update({
        where: { id: user.id },
        data: { resetPasswordToken: resetTokenHash, resetPasswordExpires: resetTokenExpires },
      });
    } else {
      await this.prisma.donor.update({
        where: { id: user.id },
        data: { resetPasswordToken: resetTokenHash, resetPasswordExpires: resetTokenExpires },
      });
    }

    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}&email=${email}&type=${type}`;

    await this.verificationService.sendForgotPasswordEmail(email, resetUrl, type);

    return { success: true, message: 'Password reset link sent to your email.' };
  }

  async resetPassword(data: { email: string; token: string; type: 'DONOR' | 'PARTNER' | 'VOLUNTEER'; newPassword: string }) {
    const email = this.sanitizeInput(data.email.toLowerCase());
    const resetTokenHash = crypto.createHash('sha256').update(data.token).digest('hex');

    let user;
    if (data.type === 'PARTNER') {
      user = await this.prisma.partner.findUnique({
        where: { email, resetPasswordToken: resetTokenHash, resetPasswordExpires: { gt: new Date() } },
      });
    } else {
      user = await this.prisma.donor.findUnique({
        where: { email, resetPasswordToken: resetTokenHash, resetPasswordExpires: { gt: new Date() } },
      });
    }

    if (!user) {
      throw new BadRequestException('Invalid or expired password reset token.');
    }

    const passwordError = this.validatePasswordStrength(data.newPassword);
    if (passwordError) throw new BadRequestException(passwordError);

    const hashedNewPassword = await bcrypt.hash(data.newPassword, 12);

    if (data.type === 'PARTNER') {
      await this.prisma.partner.update({
        where: { id: user.id },
        data: { password: hashedNewPassword, resetPasswordToken: null, resetPasswordExpires: null },
      });
    } else {
      await this.prisma.donor.update({
        where: { id: user.id },
        data: { password: hashedNewPassword, resetPasswordToken: null, resetPasswordExpires: null },
      });
    }

    return { success: true, message: 'Password updated successfully! You can now sign in.' };
  }
  async toggleTwoFactor(userId: string, enabled: boolean) {
    await this.prisma.donor.update({
      where: { id: userId },
      // @ts-ignore
      data: { twoFactorEnabled: enabled }
    });
    return { 
      success: true, 
      message: `Two-factor authentication ${enabled ? 'enabled' : 'disabled'} successfully.` 
    };
  }

  async revokeOtherSessions(userId: string) {
    await this.prisma.donor.update({
      where: { id: userId },
      // @ts-ignore
      data: { tokenVersion: { increment: 1 } }
    });
    return { 
      success: true, 
      message: 'All other active sessions have been revoked.' 
    };
  }
}
