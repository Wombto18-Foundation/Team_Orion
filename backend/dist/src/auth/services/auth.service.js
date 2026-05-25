"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../../prisma/services/prisma.service");
const mailer_service_1 = require("./mailer.service");
const config_1 = require("@nestjs/config");
const bcrypt = __importStar(require("bcryptjs"));
const verification_service_1 = require("../../verification/verification.service");
const whatsapp_service_1 = require("../../whatsapp/whatsapp.service");
const crypto = __importStar(require("crypto"));
const otpAttempts = new Map();
const MAX_OTP_ATTEMPTS = 5;
const OTP_LOCKOUT_MS = 15 * 60 * 1000;
const OTP_WINDOW_MS = 10 * 60 * 1000;
const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 10;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
let AuthService = class AuthService {
    prisma;
    jwtService;
    mailerService;
    verificationService;
    configService;
    whatsappService;
    constructor(prisma, jwtService, mailerService, verificationService, configService, whatsappService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.mailerService = mailerService;
        this.verificationService = verificationService;
        this.configService = configService;
        this.whatsappService = whatsappService;
    }
    generateIdentityId(role) {
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
    checkLoginRateLimit(identifier) {
        const now = Date.now();
        const record = loginAttempts.get(identifier);
        if (record) {
            if (now - record.firstAttempt > LOGIN_WINDOW_MS) {
                loginAttempts.set(identifier, { count: 1, firstAttempt: now });
            }
            else if (record.count >= MAX_LOGIN_ATTEMPTS) {
                const minutesLeft = Math.ceil((LOGIN_WINDOW_MS - (now - record.firstAttempt)) / 60000);
                throw new common_1.HttpException(`Too many login attempts. Please try again in ${minutesLeft} minute(s).`, common_1.HttpStatus.TOO_MANY_REQUESTS);
            }
            else {
                record.count++;
            }
        }
        else {
            loginAttempts.set(identifier, { count: 1, firstAttempt: now });
        }
    }
    checkOtpRateLimit(identifier) {
        const now = Date.now();
        const record = otpAttempts.get(identifier);
        if (record) {
            if (record.lockedUntil && now < record.lockedUntil) {
                const minutesLeft = Math.ceil((record.lockedUntil - now) / 60000);
                throw new common_1.HttpException(`Account temporarily locked. Try again in ${minutesLeft} minute(s).`, common_1.HttpStatus.TOO_MANY_REQUESTS);
            }
            if (now - record.lastAttempt > OTP_WINDOW_MS) {
                otpAttempts.set(identifier, { count: 1, lastAttempt: now });
                return;
            }
            record.count++;
            record.lastAttempt = now;
            if (record.count > MAX_OTP_ATTEMPTS) {
                record.lockedUntil = now + OTP_LOCKOUT_MS;
                throw new common_1.HttpException('Too many failed OTP attempts. Account locked for 15 minutes.', common_1.HttpStatus.TOO_MANY_REQUESTS);
            }
        }
        else {
            otpAttempts.set(identifier, { count: 1, lastAttempt: now });
        }
    }
    resetOtpRateLimit(identifier) {
        otpAttempts.delete(identifier);
    }
    validateEmail(email) {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(email);
    }
    validateMobile(mobile) {
        const mobileRegex = /^(\+91[\s-]?)?[6-9]\d{9}$/;
        return mobileRegex.test(mobile.replace(/[\s-]/g, ''));
    }
    validatePasswordStrength(password) {
        if (password.length < 8)
            return 'Password must be at least 8 characters long.';
        if (!/[A-Z]/.test(password))
            return 'Password must contain at least one uppercase letter.';
        if (!/[a-z]/.test(password))
            return 'Password must contain at least one lowercase letter.';
        if (!/\d/.test(password))
            return 'Password must contain at least one number.';
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password))
            return 'Password must contain at least one special character.';
        return null;
    }
    sanitizeInput(input) {
        return input.trim().replace(/[<>]/g, '');
    }
    generateOtp() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
    async hashOtp(otp) {
        return bcrypt.hash(otp, 8);
    }
    async verifyOtpHash(otp, hash) {
        return bcrypt.compare(otp, hash);
    }
    async tryAdminLogin(email, password) {
        const normalizedEmail = this.sanitizeInput(email.toLowerCase());
        const dbAdmin = await this.prisma.admin.findUnique({ where: { email: normalizedEmail } });
        if (!dbAdmin)
            return null;
        if (!dbAdmin.isActive)
            return { error: 'This admin account has been deactivated.', statusCode: 401 };
        const passwordValid = await bcrypt.compare(password, dbAdmin.password);
        if (!passwordValid)
            return { error: 'Invalid admin credentials.', statusCode: 401 };
        console.log(`[AuthService] State admin login successful for ${normalizedEmail} (state: ${dbAdmin.state})`);
        const payload = {
            sub: dbAdmin.id,
            email: dbAdmin.email,
            role: dbAdmin.role,
            state: dbAdmin.state,
            name: dbAdmin.name,
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
    async tryCampOrganizerLogin(email, password) {
        const normalizedEmail = this.sanitizeInput(email.toLowerCase());
        const organizer = await this.prisma.campOrganizer.findUnique({ where: { email: normalizedEmail } });
        if (!organizer)
            return null;
        if (!organizer.isActive)
            return { error: 'This account has been deactivated.', statusCode: 401 };
        if (organizer.accessExpiresAt && new Date() > new Date(organizer.accessExpiresAt)) {
            return { error: 'Camp organizer access has expired.', statusCode: 401 };
        }
        const passwordValid = await bcrypt.compare(password, organizer.password);
        if (!passwordValid)
            return null;
        await this.prisma.campOrganizer.update({
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
                ? `/organizer/camp/${organizer.campId}`
                : '/organizer/set-password',
            otpSent: false,
        };
    }
    async adminLogin(email, password) {
        email = this.sanitizeInput(email.toLowerCase());
        this.checkLoginRateLimit(`admin:${email}`);
        const dbAdmin = await this.prisma.admin.findUnique({ where: { email } });
        if (dbAdmin) {
            if (!dbAdmin.isActive) {
                throw new common_1.UnauthorizedException('This admin account has been deactivated.');
            }
            const passwordValid = await bcrypt.compare(password, dbAdmin.password);
            if (!passwordValid) {
                throw new common_1.UnauthorizedException('Invalid admin credentials.');
            }
            console.log(`[AuthService] State admin login successful for ${email} (state: ${dbAdmin.state})`);
            const payload = {
                sub: dbAdmin.id,
                email: dbAdmin.email,
                role: dbAdmin.role,
                state: dbAdmin.state,
                name: dbAdmin.name,
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
        const adminEmail = this.configService.get('ADMIN_EMAIL')?.toLowerCase();
        const adminPassword = this.configService.get('ADMIN_PASSWORD');
        if (!adminEmail || !adminPassword) {
            throw new common_1.BadRequestException('Admin credentials not configured.');
        }
        if (email !== adminEmail) {
            throw new common_1.UnauthorizedException('Invalid admin credentials.');
        }
        if (password !== adminPassword) {
            throw new common_1.UnauthorizedException('Invalid admin credentials.');
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
    async campOrganizerLogin(email, password) {
        email = this.sanitizeInput(email.toLowerCase());
        this.checkLoginRateLimit(`organizer:${email}`);
        const organizer = await this.prisma.campOrganizer.findUnique({ where: { email } });
        if (!organizer) {
            throw new common_1.UnauthorizedException('Invalid credentials.');
        }
        if (!organizer.isActive) {
            throw new common_1.UnauthorizedException('This account has been deactivated.');
        }
        if (organizer.accessExpiresAt && new Date() > new Date(organizer.accessExpiresAt)) {
            throw new common_1.UnauthorizedException('Camp organizer access has expired.');
        }
        const passwordValid = await bcrypt.compare(password, organizer.password);
        if (!passwordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials.');
        }
        await this.prisma.campOrganizer.update({
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
            redirect: organizer.hasChangedPassword ? `/organizer/camp/${organizer.campId}` : '/organizer/set-password',
            otpSent: false,
        };
    }
    async donorLogin(identifier, flags) {
        identifier = this.sanitizeInput(identifier.toLowerCase());
        console.log(`[AuthService] Login attempt for: ${identifier}`);
        this.checkLoginRateLimit(identifier);
        const donor = await this.prisma.donor.findFirst({
            where: {
                OR: [
                    { email: identifier },
                    { donorId: identifier },
                ],
            },
        });
        if (!donor) {
            throw new common_1.BadRequestException('No account found with these credentials. Please register first.');
        }
        if (!donor.password) {
            throw new common_1.BadRequestException('No password set for this account. Please contact support or register again.');
        }
        if (!flags?.password) {
            throw new common_1.BadRequestException('Password is required to sign in.');
        }
        const isPasswordValid = await bcrypt.compare(flags.password, donor.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials. Please check your email/ID and password.');
        }
        console.log(`[AuthService] Password verified for ${donor.donorId}`);
        const isVolunteer = donor.isVolunteer || ('volunteerId' in donor && !!donor.volunteerId);
        if (isVolunteer) {
            const payload = { sub: donor.id, email: donor.email, donorId: donor.donorId };
            const token = this.jwtService.sign(payload);
            const volRecord = await this.prisma.volunteer.findFirst({ where: { donorId: donor.id } });
            const volunteerId = volRecord ? volRecord.volunteerId : undefined;
            const profileCompleted = !!volRecord?.city && !!volRecord?.profession;
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
        if (donor.twoFactorEnabled) {
            const emailOtp = this.generateOtp();
            const emailOtpHash = await this.hashOtp(emailOtp);
            const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
            await this.prisma.donor.update({
                where: { id: donor.id },
                data: { emailOtpHash, otpExpiry },
            });
            await this.mailerService.sendOtpEmail(donor.email, emailOtp);
            const debugOtp = this.configService.get('DEBUG_OTP') === 'true';
            const isProduction = this.configService.get('NODE_ENV') === 'production';
            return {
                success: true,
                otpSent: true,
                twoFactorPending: true,
                donorId: donor.donorId,
                message: 'Two-factor authentication is enabled. Please enter the OTP sent to your email.',
                ...(!isProduction && debugOtp ? { devOtp: emailOtp } : {}),
            };
        }
        const payload = {
            sub: donor.id,
            email: donor.email,
            donorId: donor.donorId,
            tokenVersion: donor.tokenVersion || 0
        };
        const token = this.jwtService.sign(payload);
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
    async donorRegister(data) {
        const email = this.sanitizeInput(data.email.toLowerCase());
        const name = this.sanitizeInput(data.name);
        const mobile = data.mobile ? this.sanitizeInput(data.mobile) : undefined;
        console.log(`[AuthService] Registration attempt for: ${email}`);
        this.checkLoginRateLimit(email);
        if (!this.validateEmail(email)) {
            throw new common_1.BadRequestException('Please provide a valid email address.');
        }
        if (!name || name.length < 2) {
            throw new common_1.BadRequestException('Full name must be at least 2 characters.');
        }
        if (name.length > 100) {
            throw new common_1.BadRequestException('Name is too long (max 100 characters).');
        }
        if (mobile && !this.validateMobile(mobile)) {
            throw new common_1.BadRequestException('Please provide a valid Indian mobile number (e.g. +91 9876543210).');
        }
        const passwordError = this.validatePasswordStrength(data.password);
        if (passwordError) {
            throw new common_1.BadRequestException(passwordError);
        }
        const existingDonor = await this.prisma.donor.findUnique({
            where: { email },
        });
        let donorRecordId = null;
        let isGuestClaim = false;
        if (existingDonor) {
            if (!existingDonor.password && !existingDonor.emailVerified) {
                donorRecordId = existingDonor.id;
                isGuestClaim = true;
            }
            else {
                throw new common_1.BadRequestException('An account with this email already exists. Please sign in instead.');
            }
        }
        const newDonorId = this.generateIdentityId('DNR');
        const hashedPassword = await bcrypt.hash(data.password, 12);
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
        }
        else {
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
        const emailOtp = this.generateOtp();
        const emailOtpHash = await this.hashOtp(emailOtp);
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
        let mobileOtp = null;
        let mobileOtpHash = null;
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
        const debugOtp = this.configService.get('DEBUG_OTP') === 'true';
        const isProduction = this.configService.get('NODE_ENV') === 'production';
        return {
            success: true,
            otpSent: true,
            donorId: donor.donorId,
            requiresMobileOtp: !!mobileOtp,
            message: 'Account created successfully! Please verify your email and mobile with the OTPs sent.',
            ...(!isProduction && debugOtp ? { devOtp: emailOtp, devMobileOtp: mobileOtp } : {}),
        };
    }
    async resendOtp(identifier) {
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
            throw new common_1.BadRequestException('No account found with this email.');
        }
        const emailOtp = this.generateOtp();
        const emailOtpHash = await this.hashOtp(emailOtp);
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
        let mobileOtp = null;
        let mobileOtpHash = null;
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
        const debugOtp = this.configService.get('DEBUG_OTP') === 'true';
        const isProduction = this.configService.get('NODE_ENV') === 'production';
        return {
            success: true,
            requiresMobileOtp: !!mobileOtp,
            message: 'New OTPs have been sent to your email and mobile.',
            ...(!isProduction && debugOtp ? { devOtp: emailOtp, devMobileOtp: mobileOtp } : {}),
        };
    }
    async verifyOtp(identifier, otp) {
        identifier = this.sanitizeInput(identifier.toLowerCase());
        otp = this.sanitizeInput(otp);
        this.checkOtpRateLimit(identifier);
        if (!/^\d{6}$/.test(otp)) {
            throw new common_1.BadRequestException('OTP must be exactly 6 digits.');
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
            throw new common_1.BadRequestException('No OTP request found. Please request a new OTP.');
        }
        if (new Date() > donor.otpExpiry) {
            await this.prisma.donor.update({
                where: { id: donor.id },
                data: { otpHash: null, emailOtpHash: null, mobileOtpHash: null, otpExpiry: null },
            });
            throw new common_1.BadRequestException('OTP has expired. Please request a new one.');
        }
        const targetHash = donor.emailOtpHash || donor.otpHash;
        const isValid = await this.verifyOtpHash(otp, targetHash);
        if (!isValid) {
            throw new common_1.UnauthorizedException('Invalid OTP. Please check and try again.');
        }
        const wasAlreadyVerified = donor.emailVerified === true;
        await this.prisma.donor.update({
            where: { id: donor.id },
            data: { otpHash: null, emailOtpHash: null, mobileOtpHash: null, otpExpiry: null, emailVerified: true },
        });
        this.resetOtpRateLimit(identifier);
        const payload = { sub: donor.id, email: donor.email, donorId: donor.donorId };
        const token = this.jwtService.sign(payload);
        const isVolunteer = donor.isVolunteer || ('volunteerId' in donor && !!donor.volunteerId);
        const role = isVolunteer ? 'VOLUNTEER' : 'DONOR';
        let volunteerId;
        let profileCompleted = false;
        if (isVolunteer) {
            const volRecord = await this.prisma.volunteer.findFirst({ where: { donorId: donor.id } });
            if (volRecord) {
                volunteerId = volRecord.volunteerId;
                profileCompleted = !!volRecord.city && !!volRecord.profession;
            }
        }
        if (!wasAlreadyVerified) {
            if (isVolunteer) {
                this.mailerService.sendWelcomeVolunteerEmail({
                    email: donor.email,
                    name: donor.name || 'Volunteer',
                    donorId: donor.donorId,
                    volunteerId,
                }).catch((err) => console.error('[WELCOME EMAIL ERROR] Volunteer:', err.message));
                if (donor.mobile) {
                    this.whatsappService.sendWelcomeVolunteer(donor.mobile, donor.name || 'Volunteer');
                }
            }
            else {
                this.mailerService.sendWelcomeDonorEmail({
                    email: donor.email,
                    name: donor.name || 'Donor',
                    donorId: donor.donorId,
                }).catch((err) => console.error('[WELCOME EMAIL ERROR] Donor:', err.message));
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
    async verifyDualOtp(identifier, emailOtp, mobileOtp) {
        identifier = this.sanitizeInput(identifier.toLowerCase());
        emailOtp = this.sanitizeInput(emailOtp);
        if (mobileOtp)
            mobileOtp = this.sanitizeInput(mobileOtp);
        this.checkOtpRateLimit(identifier);
        if (!/^\d{6}$/.test(emailOtp)) {
            throw new common_1.BadRequestException('Email OTP must be exactly 6 digits.');
        }
        if (mobileOtp && !/^\d{6}$/.test(mobileOtp)) {
            throw new common_1.BadRequestException('Mobile OTP must be exactly 6 digits.');
        }
        let userFoundInModel = 'DONOR';
        let userType = 'DONOR';
        let user = await this.prisma.partner.findUnique({ where: { email: identifier } });
        if (user) {
            userType = 'PARTNER';
            userFoundInModel = 'PARTNER';
        }
        else {
            user = await this.prisma.donor.findFirst({
                where: { OR: [{ email: identifier }, { donorId: identifier }] },
            });
            if (!user)
                throw new common_1.BadRequestException('No OTP request found for this identity.');
            userFoundInModel = 'DONOR';
            if (user.isVolunteer) {
                userType = 'VOLUNTEER';
                const volRecord = await this.prisma.volunteer.findFirst({ where: { donorId: user.id } });
                if (volRecord) {
                    user.volunteerId = volRecord.volunteerId;
                }
            }
        }
        if (!user.emailOtpHash && !user.otpHash) {
            throw new common_1.BadRequestException('No OTP request found. Please request a new OTP.');
        }
        const targetEmailHash = user.emailOtpHash || user.otpHash;
        if (user.otpExpiry && new Date() > user.otpExpiry) {
            if (userType === 'PARTNER') {
                await this.prisma.partner.update({ where: { id: user.id }, data: { emailOtpHash: null, mobileOtpHash: null } });
            }
            else if (userType === 'VOLUNTEER') {
                await this.prisma.volunteer.update({ where: { id: user.id }, data: { emailOtpHash: null, mobileOtpHash: null } });
            }
            else {
                await this.prisma.donor.update({ where: { id: user.id }, data: { otpHash: null, emailOtpHash: null, mobileOtpHash: null, otpExpiry: null } });
            }
            throw new common_1.BadRequestException('OTP has expired. Please request a new one.');
        }
        const isEmailValid = await this.verifyOtpHash(emailOtp, targetEmailHash);
        if (!isEmailValid) {
            throw new common_1.UnauthorizedException('Invalid Email OTP.');
        }
        if (mobileOtp && user.mobileOtpHash) {
            const isMobileValid = await this.verifyOtpHash(mobileOtp, user.mobileOtpHash);
            if (!isMobileValid) {
                throw new common_1.UnauthorizedException('Invalid Mobile SMS OTP.');
            }
        }
        const wasAlreadyVerified = user.emailVerified === true;
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
        }
        else {
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
        if (!wasAlreadyVerified) {
            if (userType === 'PARTNER') {
                this.mailerService.sendWelcomePartnerEmail({
                    email: user.email,
                    contactPerson: user.contactPerson || user.name || 'Partner',
                    organizationName: user.organizationName || 'Your Organization',
                    partnerId: user.partnerId,
                }).catch((err) => console.error('[WELCOME EMAIL ERROR] Partner:', err.message));
                if (user.mobile) {
                    this.whatsappService.sendWelcomePartner(user.mobile, user.contactPerson || user.name || 'Partner');
                }
            }
            else if (userType === 'VOLUNTEER') {
                this.mailerService.sendWelcomeVolunteerEmail({
                    email: user.email,
                    name: user.name || 'Volunteer',
                    donorId: user.donorId,
                    volunteerId: user.volunteerId,
                }).catch((err) => console.error('[WELCOME EMAIL ERROR] Volunteer:', err.message));
                if (user.mobile) {
                    this.whatsappService.sendWelcomeVolunteer(user.mobile, user.name || 'Volunteer');
                }
            }
            else {
                this.mailerService.sendWelcomeDonorEmail({
                    email: user.email,
                    name: user.name || 'Donor',
                    donorId: user.donorId,
                }).catch((err) => console.error('[WELCOME EMAIL ERROR] Donor:', err.message));
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
    async forgotPassword(email, type) {
        email = this.sanitizeInput(email.toLowerCase());
        let user;
        if (type === 'PARTNER') {
            user = await this.prisma.partner.findUnique({ where: { email } });
            if (!user) {
                throw new common_1.BadRequestException('No partner account found with this institutional email.');
            }
        }
        else {
            user = await this.prisma.donor.findUnique({ where: { email } });
            if (!user) {
                throw new common_1.BadRequestException(`No ${type.toLowerCase()} account found with this email. Please register first.`);
            }
            if (type === 'VOLUNTEER' && !user.isVolunteer) {
                throw new common_1.BadRequestException('This email is registered as a donor, but not as a volunteer. Please log in as a donor.');
            }
        }
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
        const resetTokenExpires = new Date(Date.now() + 3600000);
        if (type === 'PARTNER') {
            await this.prisma.partner.update({
                where: { id: user.id },
                data: { resetPasswordToken: resetTokenHash, resetPasswordExpires: resetTokenExpires },
            });
        }
        else {
            await this.prisma.donor.update({
                where: { id: user.id },
                data: { resetPasswordToken: resetTokenHash, resetPasswordExpires: resetTokenExpires },
            });
        }
        const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:5173';
        const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}&email=${email}&type=${type}`;
        await this.verificationService.sendForgotPasswordEmail(email, resetUrl, type);
        return { success: true, message: 'Password reset link sent to your email.' };
    }
    async resetPassword(data) {
        const email = this.sanitizeInput(data.email.toLowerCase());
        const resetTokenHash = crypto.createHash('sha256').update(data.token).digest('hex');
        let user;
        if (data.type === 'PARTNER') {
            user = await this.prisma.partner.findUnique({
                where: { email, resetPasswordToken: resetTokenHash, resetPasswordExpires: { gt: new Date() } },
            });
        }
        else {
            user = await this.prisma.donor.findUnique({
                where: { email, resetPasswordToken: resetTokenHash, resetPasswordExpires: { gt: new Date() } },
            });
        }
        if (!user) {
            throw new common_1.BadRequestException('Invalid or expired password reset token.');
        }
        const passwordError = this.validatePasswordStrength(data.newPassword);
        if (passwordError)
            throw new common_1.BadRequestException(passwordError);
        const hashedNewPassword = await bcrypt.hash(data.newPassword, 12);
        if (data.type === 'PARTNER') {
            await this.prisma.partner.update({
                where: { id: user.id },
                data: { password: hashedNewPassword, resetPasswordToken: null, resetPasswordExpires: null },
            });
        }
        else {
            await this.prisma.donor.update({
                where: { id: user.id },
                data: { password: hashedNewPassword, resetPasswordToken: null, resetPasswordExpires: null },
            });
        }
        return { success: true, message: 'Password updated successfully! You can now sign in.' };
    }
    async toggleTwoFactor(userId, enabled) {
        await this.prisma.donor.update({
            where: { id: userId },
            data: { twoFactorEnabled: enabled }
        });
        return {
            success: true,
            message: `Two-factor authentication ${enabled ? 'enabled' : 'disabled'} successfully.`
        };
    }
    async revokeOtherSessions(userId) {
        await this.prisma.donor.update({
            where: { id: userId },
            data: { tokenVersion: { increment: 1 } }
        });
        return {
            success: true,
            message: 'All other active sessions have been revoked.'
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        mailer_service_1.MailerService,
        verification_service_1.VerificationService,
        config_1.ConfigService,
        whatsapp_service_1.WhatsappService])
], AuthService);
//# sourceMappingURL=auth.service.js.map