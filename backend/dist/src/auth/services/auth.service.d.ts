import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/services/prisma.service';
import { MailerService } from './mailer.service';
import { ConfigService } from '@nestjs/config';
import { VerificationService } from '../../verification/verification.service';
import { WhatsappService } from '../../whatsapp/whatsapp.service';
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    private readonly mailerService;
    private readonly verificationService;
    private readonly configService;
    private readonly whatsappService;
    constructor(prisma: PrismaService, jwtService: JwtService, mailerService: MailerService, verificationService: VerificationService, configService: ConfigService, whatsappService: WhatsappService);
    private generateIdentityId;
    private checkLoginRateLimit;
    private checkOtpRateLimit;
    private resetOtpRateLimit;
    private validateEmail;
    private validateMobile;
    private validatePasswordStrength;
    private sanitizeInput;
    private generateOtp;
    private hashOtp;
    private verifyOtpHash;
    tryAdminLogin(email: string, password: string): Promise<Record<string, unknown> | null>;
    tryCampOrganizerLogin(email: string, password: string): Promise<Record<string, unknown> | null>;
    adminLogin(email: string, password: string): Promise<{
        success: boolean;
        token: string;
        name: any;
        role: any;
        state: any;
        redirect: string;
        otpSent: boolean;
    }>;
    campOrganizerLogin(email: string, password: string): Promise<{
        success: boolean;
        token: string;
        name: any;
        role: string;
        campId: any;
        hasChangedPassword: any;
        redirect: string;
        otpSent: boolean;
    }>;
    donorLogin(identifier: string, flags?: {
        isVolunteer?: boolean;
        isNonDonor?: boolean;
        name?: string;
        mobile?: string;
        password?: string;
        referredById?: string;
    }): Promise<{
        success: boolean;
        token: string;
        name: string | null;
        donorId: string;
        volunteerId: string | undefined;
        eligible: boolean;
        tier: string;
        isVolunteer: boolean;
        profileCompleted: boolean;
        role: string;
        redirect: string;
        otpSent: boolean;
    } | {
        devOtp?: string | undefined;
        success: boolean;
        otpSent: boolean;
        twoFactorPending: boolean;
        donorId: string;
        message: string;
        token?: undefined;
        name?: undefined;
        volunteerId?: undefined;
        eligible?: undefined;
        tier?: undefined;
        isVolunteer?: undefined;
        profileCompleted?: undefined;
        role?: undefined;
        redirect?: undefined;
    } | {
        success: boolean;
        token: string;
        name: string | null;
        donorId: string;
        eligible: boolean;
        tier: string;
        isVolunteer: boolean;
        role: string;
        redirect: string;
        otpSent: boolean;
        volunteerId?: undefined;
        profileCompleted?: undefined;
    }>;
    donorRegister(data: {
        email: string;
        password: string;
        name: string;
        mobile?: string;
        isVolunteer?: boolean;
        isNonDonor?: boolean;
        referredById?: string;
    }): Promise<{
        devOtp?: string | undefined;
        devMobileOtp?: string | null | undefined;
        success: boolean;
        otpSent: boolean;
        donorId: any;
        requiresMobileOtp: boolean;
        message: string;
    }>;
    resendOtp(identifier: string): Promise<{
        devOtp?: string | undefined;
        devMobileOtp?: string | null | undefined;
        success: boolean;
        requiresMobileOtp: boolean;
        message: string;
    }>;
    verifyOtp(identifier: string, otp: string): Promise<{
        success: boolean;
        token: string;
        name: string | null;
        mobile: string | null;
        donorId: string;
        volunteerId: string | undefined;
        eligible: boolean;
        tier: string;
        isVolunteer: boolean;
        profileCompleted: boolean;
        role: string;
        redirect: string;
    }>;
    verifyDualOtp(identifier: string, emailOtp: string, mobileOtp?: string): Promise<{
        success: boolean;
        token: string;
        name: any;
        mobile: any;
        donorId: any;
        volunteerId: any;
        partnerId: any;
        eligible: boolean;
        tier: any;
        profileCompleted: boolean;
        role: "DONOR" | "VOLUNTEER" | "PARTNER";
    }>;
    forgotPassword(email: string, type: 'DONOR' | 'PARTNER' | 'VOLUNTEER'): Promise<{
        success: boolean;
        message: string;
    }>;
    resetPassword(data: {
        email: string;
        token: string;
        type: 'DONOR' | 'PARTNER' | 'VOLUNTEER';
        newPassword: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    toggleTwoFactor(userId: string, enabled: boolean): Promise<{
        success: boolean;
        message: string;
    }>;
    revokeOtherSessions(userId: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
