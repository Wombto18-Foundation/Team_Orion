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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/services/prisma.service");
const mailer_service_1 = require("../../auth/services/mailer.service");
const config_1 = require("@nestjs/config");
const bcrypt = __importStar(require("bcryptjs"));
const crypto = __importStar(require("crypto"));
let AdminService = class AdminService {
    prisma;
    mailer;
    config;
    constructor(prisma, mailer, config) {
        this.prisma = prisma;
        this.mailer = mailer;
        this.config = config;
    }
    generatePassword(length = 12) {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!';
        return Array.from(crypto.randomBytes(length))
            .map((b) => chars[b % chars.length])
            .join('');
    }
    async createSubAdmin(data) {
        const existing = await this.prisma.admin.findUnique({ where: { email: data.email.toLowerCase() } });
        if (existing)
            throw new common_1.BadRequestException('An admin with this email already exists.');
        const rawPassword = (!data.password || data.password === 'auto-generate')
            ? this.generatePassword()
            : data.password;
        const hashed = await bcrypt.hash(rawPassword, 10);
        const frontendUrl = this.config.get('FRONTEND_URL') || 'http://localhost:5173';
        const admin = await this.prisma.admin.create({
            data: {
                email: data.email.toLowerCase().trim(),
                password: hashed,
                name: data.name,
                phone: data.phone,
                state: data.state,
                role: 'STATE_ADMIN',
                createdById: data.createdById,
            },
        });
        await this.mailer.sendStateAdminWelcomeEmail({
            email: admin.email,
            name: admin.name,
            state: admin.state,
            password: rawPassword,
            loginUrl: `${frontendUrl}/login`,
        });
        return {
            success: true,
            admin: {
                id: admin.id,
                name: admin.name,
                email: admin.email,
                state: admin.state,
                role: admin.role,
                isActive: admin.isActive,
                createdAt: admin.createdAt,
            },
        };
    }
    async listSubAdmins() {
        const admins = await this.prisma.admin.findMany({
            where: { role: 'STATE_ADMIN' },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                state: true,
                role: true,
                isActive: true,
                createdById: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        return { success: true, admins };
    }
    async updateSubAdmin(id, data) {
        const admin = await this.prisma.admin.findUnique({ where: { id } });
        if (!admin)
            throw new common_1.NotFoundException('Admin not found.');
        const updated = await this.prisma.admin.update({
            where: { id },
            data: {
                ...(data.name && { name: data.name }),
                ...(data.phone !== undefined && { phone: data.phone }),
                ...(data.state && { state: data.state }),
            },
            select: { id: true, name: true, email: true, phone: true, state: true, role: true, isActive: true, updatedAt: true },
        });
        return { success: true, admin: updated };
    }
    async toggleSubAdmin(id) {
        const admin = await this.prisma.admin.findUnique({ where: { id } });
        if (!admin)
            throw new common_1.NotFoundException('Admin not found.');
        const updated = await this.prisma.admin.update({
            where: { id },
            data: { isActive: !admin.isActive },
            select: { id: true, name: true, email: true, state: true, isActive: true },
        });
        return {
            success: true,
            admin: updated,
            message: updated.isActive ? 'Admin reactivated.' : 'Admin deactivated. Access revoked immediately.',
        };
    }
    async deleteSubAdmin(id, confirm) {
        if (confirm !== 'DELETE') {
            throw new common_1.BadRequestException('Type "DELETE" in the confirm field to permanently delete this admin.');
        }
        const admin = await this.prisma.admin.findUnique({ where: { id } });
        if (!admin)
            throw new common_1.NotFoundException('Admin not found.');
        await this.prisma.admin.delete({ where: { id } });
        return { success: true, message: `Admin ${admin.name} (${admin.email}) permanently deleted.` };
    }
    async resetSubAdminPassword(id) {
        const admin = await this.prisma.admin.findUnique({ where: { id } });
        if (!admin)
            throw new common_1.NotFoundException('Admin not found.');
        const newPassword = this.generatePassword();
        const hashed = await bcrypt.hash(newPassword, 10);
        const frontendUrl = this.config.get('FRONTEND_URL') || 'http://localhost:5173';
        await this.prisma.admin.update({
            where: { id },
            data: { password: hashed },
        });
        await this.mailer.sendStateAdminPasswordResetEmail({
            email: admin.email,
            name: admin.name,
            newPassword,
            loginUrl: `${frontendUrl}/login`,
        });
        return { success: true, message: `Password reset and emailed to ${admin.email}.` };
    }
    async listWithdrawals(filters) {
        const where = {};
        if (filters.status && filters.status !== 'ALL') {
            where.status = filters.status;
        }
        if (filters.startDate || filters.endDate) {
            where.createdAt = {};
            if (filters.startDate)
                where.createdAt.gte = new Date(filters.startDate);
            if (filters.endDate)
                where.createdAt.lte = new Date(filters.endDate);
        }
        if (filters.state) {
            where.volunteer = { state: filters.state };
        }
        const requests = await this.prisma.withdrawalRequest.findMany({
            where,
            include: {
                volunteer: {
                    select: {
                        id: true,
                        volunteerId: true,
                        name: true,
                        email: true,
                        mobile: true,
                        state: true,
                        bankDetails: true,
                        totalCoins: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 500,
        });
        return { success: true, withdrawals: requests };
    }
    async getWithdrawalStats(state) {
        let volunteerIdFilter = {};
        if (state) {
            const vols = await this.prisma.volunteer.findMany({
                where: { state },
                select: { id: true },
            });
            volunteerIdFilter = { volunteerId: { in: vols.map((v) => v.id) } };
        }
        const [pending, approved, paid, rejected, pendingRecords] = await Promise.all([
            this.prisma.withdrawalRequest.count({ where: { status: 'PENDING', ...volunteerIdFilter } }),
            this.prisma.withdrawalRequest.count({ where: { status: 'APPROVED', ...volunteerIdFilter } }),
            this.prisma.withdrawalRequest.count({ where: { status: 'PAID', ...volunteerIdFilter } }),
            this.prisma.withdrawalRequest.count({ where: { status: 'REJECTED', ...volunteerIdFilter } }),
            this.prisma.withdrawalRequest.findMany({
                where: { status: 'PENDING', ...volunteerIdFilter },
                select: { amountInr: true },
            }),
        ]);
        const pendingAmountInr = pendingRecords
            .reduce((sum, r) => sum + (r.amountInr || 0), 0);
        return {
            success: true,
            stats: { pending, approved, paid, rejected, pendingAmountInr },
        };
    }
    async approveWithdrawal(id, reviewedBy, adminNotes) {
        const req = await this.prisma.withdrawalRequest.findUnique({
            where: { id },
            include: { volunteer: { select: { name: true, email: true } } },
        });
        if (!req)
            throw new common_1.NotFoundException('Withdrawal request not found.');
        if (req.status !== 'PENDING') {
            throw new common_1.BadRequestException(`Cannot approve a request with status: ${req.status}.`);
        }
        await this.prisma.withdrawalRequest.update({
            where: { id },
            data: { status: 'APPROVED', adminNotes: adminNotes || null, reviewedBy },
        });
        await this.mailer.sendWithdrawalApprovedEmail({
            email: req.volunteer.email,
            name: req.volunteer.name,
            amountInr: req.amountInr,
            adminNotes,
        });
        return { success: true, message: 'Withdrawal approved and volunteer notified.' };
    }
    async rejectWithdrawal(id, reviewedBy, adminNotes) {
        if (!adminNotes?.trim()) {
            throw new common_1.BadRequestException('A rejection reason is required.');
        }
        const req = await this.prisma.withdrawalRequest.findUnique({
            where: { id },
            include: { volunteer: { select: { name: true, email: true, id: true } } },
        });
        if (!req)
            throw new common_1.NotFoundException('Withdrawal request not found.');
        if (req.status !== 'PENDING') {
            throw new common_1.BadRequestException(`Cannot reject a request with status: ${req.status}.`);
        }
        await this.prisma.$transaction(async (tx) => {
            await tx.withdrawalRequest.update({
                where: { id },
                data: { status: 'REJECTED', adminNotes, reviewedBy },
            });
            await tx.volunteer.update({
                where: { id: req.volunteer.id },
                data: { withdrawnThreshold: { decrement: req.amountCoins } },
            });
        });
        await this.mailer.sendWithdrawalRejectedEmail({
            email: req.volunteer.email,
            name: req.volunteer.name,
            amountInr: req.amountInr,
            adminNotes,
        });
        return { success: true, message: 'Withdrawal rejected, volunteer notified, and coins made available again.' };
    }
    async markWithdrawalPaid(id, reviewedBy, transactionRef, adminNotes) {
        if (!transactionRef?.trim()) {
            throw new common_1.BadRequestException('A transaction reference is required.');
        }
        const req = await this.prisma.withdrawalRequest.findUnique({
            where: { id },
            include: { volunteer: { select: { name: true, email: true } } },
        });
        if (!req)
            throw new common_1.NotFoundException('Withdrawal request not found.');
        if (req.status !== 'APPROVED') {
            throw new common_1.BadRequestException(`Only APPROVED requests can be marked as paid. Current status: ${req.status}.`);
        }
        await this.prisma.withdrawalRequest.update({
            where: { id },
            data: { status: 'PAID', transactionRef: transactionRef.trim(), adminNotes: adminNotes || null, reviewedBy },
        });
        await this.mailer.sendWithdrawalPaidEmail({
            email: req.volunteer.email,
            name: req.volunteer.name,
            amountInr: req.amountInr,
            transactionRef: transactionRef.trim(),
            adminNotes,
        });
        return { success: true, message: 'Withdrawal marked as paid and volunteer notified.' };
    }
    async findAllVolunteers(filters) {
        const where = {};
        if (filters.state) {
            where.state = filters.state;
        }
        if (filters.status === 'ACTIVE') {
            where.isActive = true;
        }
        else if (filters.status === 'INACTIVE') {
            where.isActive = false;
        }
        if (filters.search?.trim()) {
            const q = filters.search.trim();
            where.OR = [
                { name: { contains: q, mode: 'insensitive' } },
                { email: { contains: q, mode: 'insensitive' } },
                { volunteerId: { contains: q, mode: 'insensitive' } },
                { mobile: { contains: q, mode: 'insensitive' } },
            ];
        }
        const volunteers = await this.prisma.volunteer.findMany({
            where,
            select: {
                id: true,
                volunteerId: true,
                name: true,
                email: true,
                mobile: true,
                city: true,
                state: true,
                totalCoins: true,
                isActive: true,
                emailVerified: true,
                mobileVerified: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 1000,
        });
        return { success: true, volunteers };
    }
    async findAllDonors(state) {
        const where = state
            ? { volunteer: { state } }
            : undefined;
        const donors = await this.prisma.donor.findMany({
            where,
            include: {
                donations: {
                    where: { status: 'SUCCESS' },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        return donors.map(donor => {
            const totalAmount = donor.donations.reduce((sum, d) => sum + d.amount, 0);
            const lastDonation = donor.donations[0]?.createdAt;
            return {
                id: donor.id,
                name: donor.name || donor.email.split('@')[0],
                email: donor.email,
                totalAmount: totalAmount.toLocaleString(),
                category: donor.tier || 'DONOR',
                lastDonation: lastDonation ? this.timeAgo(lastDonation) : 'No donations'
            };
        });
    }
    timeAgo(date) {
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1)
            return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1)
            return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1)
            return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1)
            return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1)
            return Math.floor(interval) + " minutes ago";
        return Math.floor(seconds) + " seconds ago";
    }
    async findAllPrograms() {
        return this.prisma.program.findMany();
    }
    async createProgram(data) {
        return this.prisma.program.create({
            data: {
                name: data.name,
                description: data.description,
                targetAmount: data.targetAmount,
            },
        });
    }
    async getStats(range = '30D', state) {
        const startDate = this.getStartDate(range);
        const stateFilter = state ? { donor: { volunteer: { state } } } : {};
        const [totalDonationsSum, donorCount, programCount, recentDonations, historicalDonations] = await Promise.all([
            this.prisma.donation.aggregate({
                where: { status: 'SUCCESS', ...stateFilter },
                _sum: { amount: true },
            }),
            this.prisma.donor.count(state ? { where: { volunteer: { state } } } : undefined),
            this.prisma.program.count(),
            this.prisma.donation.findMany({
                where: { status: 'SUCCESS', ...stateFilter },
                take: 10,
                orderBy: { createdAt: 'desc' },
                include: { donor: true, program: true },
            }),
            this.prisma.donation.findMany({
                where: {
                    status: 'SUCCESS',
                    createdAt: { gte: startDate },
                    ...stateFilter,
                },
                orderBy: { createdAt: 'asc' },
            }),
        ]);
        const chartData = this.aggregateChartData(historicalDonations, range);
        const mappingStats = await this.getMappingStats();
        return {
            totalDonations: totalDonationsSum?._sum?.amount || 0,
            totalDonors: donorCount,
            totalPrograms: programCount,
            recentDonations,
            chartData,
            mappingStats,
        };
    }
    getStartDate(range) {
        const now = new Date();
        if (range === '7D')
            return new Date(now.setDate(now.getDate() - 7));
        if (range === '1Y')
            return new Date(now.setFullYear(now.getFullYear() - 1));
        return new Date(now.setDate(now.getDate() - 30));
    }
    aggregateChartData(donations, range) {
        const data = [];
        const now = new Date();
        if (range === '1Y') {
            for (let i = 11; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthLabel = d.toLocaleString('default', { month: 'short' });
                const amount = donations
                    .filter(don => {
                    const donDate = new Date(don.createdAt);
                    return donDate.getMonth() === d.getMonth() && donDate.getFullYear() === d.getFullYear();
                })
                    .reduce((sum, don) => sum + don.amount, 0);
                data.push({ month: monthLabel, amount });
            }
        }
        else {
            const days = range === '7D' ? 7 : 30;
            for (let i = days - 1; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dateLabel = d.toLocaleDateString('default', { month: 'short', day: 'numeric' });
                const amount = donations
                    .filter(don => {
                    const donDate = new Date(don.createdAt);
                    return donDate.toDateString() === d.toDateString();
                })
                    .reduce((sum, don) => sum + don.amount, 0);
                data.push({ month: dateLabel, amount });
            }
        }
        return data;
    }
    async getMappingStats() {
        const donorDonationCounts = await this.prisma.donation.groupBy({
            by: ['donorId'],
            where: { status: 'SUCCESS' },
            _count: { id: true },
        });
        const recurring = donorDonationCounts.filter(d => d._count.id > 1).length;
        const oneTime = donorDonationCounts.length - recurring;
        return {
            oneTime,
            recurring
        };
    }
    async findAllDonations(filters) {
        const where = {};
        if (filters.status && filters.status !== 'ALL') {
            where.status = filters.status;
        }
        if (filters.programId) {
            where.programId = filters.programId;
        }
        if (filters.startDate || filters.endDate) {
            where.createdAt = {};
            if (filters.startDate)
                where.createdAt.gte = new Date(filters.startDate);
            if (filters.endDate)
                where.createdAt.lte = new Date(filters.endDate);
        }
        if (filters.donorSearch) {
            where.OR = [
                { donor: { name: { contains: filters.donorSearch, mode: 'insensitive' } } },
                { donor: { email: { contains: filters.donorSearch, mode: 'insensitive' } } },
            ];
        }
        if (filters.state) {
            where.donor = { volunteer: { state: filters.state } };
        }
        return this.prisma.donation.findMany({
            where,
            include: { donor: true, program: true },
            orderBy: { createdAt: 'desc' },
            take: 200,
        });
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        mailer_service_1.MailerService,
        config_1.ConfigService])
], AdminService);
//# sourceMappingURL=admin.service.js.map