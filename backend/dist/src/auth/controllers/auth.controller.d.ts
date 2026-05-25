import { AuthService } from '../services/auth.service';
import type { Response } from 'express';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    adminLogin(email: string, password: string, res: Response): Promise<{
        success: boolean;
        token: string;
        name: any;
        role: any;
        state: any;
        redirect: string;
        otpSent: boolean;
    } | {
        error: string;
    }>;
    login(email: string, password: string, res: Response): Promise<Record<string, unknown> | {
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
    } | {
        redirect: string;
        success: boolean;
        token: string;
        name: any;
        role: any;
        state: any;
        otpSent: boolean;
    }>;
    register(email: string, password: string, name: string, mobile?: string, isVolunteer?: boolean, isNonDonor?: boolean, referredById?: string): Promise<{
        devOtp?: string | undefined;
        devMobileOtp?: string | null | undefined;
        success: boolean;
        otpSent: boolean;
        donorId: any;
        requiresMobileOtp: boolean;
        message: string;
    } | {
        error: string;
    }>;
    verifyOtp(email: string, otp: string, res: Response): Promise<{
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
    } | {
        error: string;
    }>;
    resendOtp(email: string): Promise<{
        devOtp?: string | undefined;
        devMobileOtp?: string | null | undefined;
        success: boolean;
        requiresMobileOtp: boolean;
        message: string;
    } | {
        error: string;
    }>;
    verifyDualOtp(email: string, emailOtp: string, mobileOtp: string | undefined, res: Response): Promise<{
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
    } | {
        error: string;
    }>;
    forgotPassword(email: string, type: 'DONOR' | 'PARTNER' | 'VOLUNTEER'): Promise<{
        success: boolean;
        message: string;
    } | {
        error: string;
    }>;
    resetPassword(email: string, token: string, type: 'DONOR' | 'PARTNER' | 'VOLUNTEER', newPassword: string): Promise<{
        success: boolean;
        message: string;
    } | {
        error: string;
    }>;
    toggle2FA(donorId: string, enabled: boolean): Promise<{
        success: boolean;
        message: string;
    }>;
    revokeSessions(donorId: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
