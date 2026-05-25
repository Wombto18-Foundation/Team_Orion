"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("../services/auth.service");
const swagger_1 = require("@nestjs/swagger");
let AuthController = class AuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    async adminLogin(email, password, res) {
        if (!email || !password) {
            return { error: 'Email and password are required.' };
        }
        const result = await this.authService.adminLogin(email, password);
        if (result.token) {
            res.cookie('auth_token', result.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 24 * 60 * 60 * 1000,
            });
        }
        return result;
    }
    async login(email, password, res) {
        if (!email || !password) {
            return { error: 'Email and password are required.' };
        }
        const normalizedEmail = email.toLowerCase().trim();
        const adminEnvEmail = process.env.ADMIN_EMAIL?.toLowerCase();
        const adminEnvPassword = process.env.ADMIN_PASSWORD;
        if (adminEnvEmail && adminEnvPassword && normalizedEmail === adminEnvEmail && password === adminEnvPassword) {
            const result = await this.authService.adminLogin(email, password);
            if (result.token) {
                res.cookie('auth_token', result.token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 24 * 60 * 60 * 1000,
                });
            }
            return { ...result, redirect: '/admin' };
        }
        const dbAdminResult = await this.authService.tryAdminLogin(email, password);
        if (dbAdminResult) {
            if (dbAdminResult.token) {
                res.cookie('auth_token', dbAdminResult.token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 24 * 60 * 60 * 1000,
                });
            }
            return dbAdminResult;
        }
        const orgResult = await this.authService.tryCampOrganizerLogin(email, password);
        if (orgResult) {
            if (orgResult.token) {
                res.cookie('auth_token', orgResult.token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 24 * 60 * 60 * 1000,
                });
            }
            return orgResult;
        }
        const result = await this.authService.donorLogin(email, { password });
        if (result.token) {
            res.cookie('auth_token', result.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 24 * 60 * 60 * 1000,
            });
        }
        return result;
    }
    async register(email, password, name, mobile, isVolunteer, isNonDonor, referredById) {
        if (!email || !password || !name) {
            return { error: 'Email, password, and name are required.' };
        }
        return this.authService.donorRegister({
            email,
            password,
            name,
            mobile,
            isVolunteer,
            isNonDonor,
            referredById,
        });
    }
    async verifyOtp(email, otp, res) {
        if (!email || !otp) {
            return { error: 'Email and OTP are required.' };
        }
        const result = await this.authService.verifyOtp(email, otp);
        res.cookie('auth_token', result.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000,
        });
        return result;
    }
    async resendOtp(email) {
        if (!email) {
            return { error: 'Email is required.' };
        }
        return this.authService.resendOtp(email);
    }
    async verifyDualOtp(email, emailOtp, mobileOtp, res) {
        if (!email || !emailOtp) {
            return { error: 'Email and Email OTP are required.' };
        }
        const result = await this.authService.verifyDualOtp(email, emailOtp, mobileOtp);
        if (result.success && result.token) {
            res.cookie('auth_token', result.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 24 * 60 * 60 * 1000,
            });
        }
        return result;
    }
    async forgotPassword(email, type) {
        if (!email || !type) {
            return { error: 'Email and user type are required.' };
        }
        return this.authService.forgotPassword(email, type);
    }
    async resetPassword(email, token, type, newPassword) {
        if (!email || !token || !type || !newPassword) {
            return { error: 'All fields are required.' };
        }
        return this.authService.resetPassword({ email, token, type, newPassword });
    }
    async toggle2FA(donorId, enabled) {
        return this.authService.toggleTwoFactor(donorId, enabled);
    }
    async revokeSessions(donorId) {
        return this.authService.revokeOtherSessions(donorId);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('admin/login'),
    (0, swagger_1.ApiOperation)({ summary: 'Super Admin login with env-stored credentials, no OTP' }),
    __param(0, (0, common_1.Body)('email')),
    __param(1, (0, common_1.Body)('password')),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "adminLogin", null);
__decorate([
    (0, common_1.Post)('donor/login'),
    (0, swagger_1.ApiOperation)({ summary: 'Login existing donor with password + OTP 2FA' }),
    __param(0, (0, common_1.Body)('email')),
    __param(1, (0, common_1.Body)('password')),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('donor/register'),
    (0, swagger_1.ApiOperation)({ summary: 'Register a new donor account' }),
    __param(0, (0, common_1.Body)('email')),
    __param(1, (0, common_1.Body)('password')),
    __param(2, (0, common_1.Body)('name')),
    __param(3, (0, common_1.Body)('mobile')),
    __param(4, (0, common_1.Body)('isVolunteer')),
    __param(5, (0, common_1.Body)('isNonDonor')),
    __param(6, (0, common_1.Body)('referredById')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, Boolean, Boolean, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('donor/verify-otp'),
    (0, swagger_1.ApiOperation)({ summary: 'Verify OTP and issue JWT' }),
    __param(0, (0, common_1.Body)('email')),
    __param(1, (0, common_1.Body)('otp')),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyOtp", null);
__decorate([
    (0, common_1.Post)('donor/resend-otp'),
    (0, swagger_1.ApiOperation)({ summary: 'Resend OTP to email' }),
    __param(0, (0, common_1.Body)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resendOtp", null);
__decorate([
    (0, common_1.Post)('auth/verify-dual-otp'),
    (0, swagger_1.ApiOperation)({ summary: 'Verify Dual OTP (Email + Mobile) across all user types' }),
    __param(0, (0, common_1.Body)('email')),
    __param(1, (0, common_1.Body)('emailOtp')),
    __param(2, (0, common_1.Body)('mobileOtp')),
    __param(3, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyDualOtp", null);
__decorate([
    (0, common_1.Post)('auth/forgot-password'),
    (0, swagger_1.ApiOperation)({ summary: 'Request a secure password reset link' }),
    __param(0, (0, common_1.Body)('email')),
    __param(1, (0, common_1.Body)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "forgotPassword", null);
__decorate([
    (0, common_1.Post)('auth/reset-password'),
    (0, swagger_1.ApiOperation)({ summary: 'Reset password using a secure link token' }),
    __param(0, (0, common_1.Body)('email')),
    __param(1, (0, common_1.Body)('token')),
    __param(2, (0, common_1.Body)('type')),
    __param(3, (0, common_1.Body)('newPassword')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resetPassword", null);
__decorate([
    (0, common_1.Post)('donor/toggle-2fa'),
    (0, swagger_1.ApiOperation)({ summary: 'Toggle 2FA for donor' }),
    __param(0, (0, common_1.Body)('donorId')),
    __param(1, (0, common_1.Body)('enabled')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Boolean]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "toggle2FA", null);
__decorate([
    (0, common_1.Post)('auth/revoke-sessions'),
    (0, swagger_1.ApiOperation)({ summary: 'Revoke all other sessions' }),
    __param(0, (0, common_1.Body)('donorId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "revokeSessions", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('Authentication'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map