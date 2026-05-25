import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/services/prisma.service';
import { MailerService } from '../../auth/services/mailer.service';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailer: MailerService,
    private readonly config: ConfigService,
  ) {}

  // ─── Sub-Admin Management ──────────────────────────────────────────────────

  private generatePassword(length = 12): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!';
    return Array.from(crypto.randomBytes(length))
      .map((b) => chars[b % chars.length])
      .join('');
  }

  async createSubAdmin(data: {
    name: string;
    email: string;
    phone?: string;
    state: string;
    password?: string;
    createdById?: string;
  }) {
    const existing = await (this.prisma as any).admin.findUnique({ where: { email: data.email.toLowerCase() } });
    if (existing) throw new BadRequestException('An admin with this email already exists.');

    const rawPassword = (!data.password || data.password === 'auto-generate')
      ? this.generatePassword()
      : data.password;

    const hashed = await bcrypt.hash(rawPassword, 10);
    const frontendUrl = this.config.get<string>('FRONTEND_URL') || 'http://localhost:5173';

    const admin = await (this.prisma as any).admin.create({
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
    const admins = await (this.prisma as any).admin.findMany({
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

  async updateSubAdmin(id: string, data: { name?: string; phone?: string; state?: string }) {
    const admin = await (this.prisma as any).admin.findUnique({ where: { id } });
    if (!admin) throw new NotFoundException('Admin not found.');

    const updated = await (this.prisma as any).admin.update({
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

  async toggleSubAdmin(id: string) {
    const admin = await (this.prisma as any).admin.findUnique({ where: { id } });
    if (!admin) throw new NotFoundException('Admin not found.');

    const updated = await (this.prisma as any).admin.update({
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

  async deleteSubAdmin(id: string, confirm: string) {
    if (confirm !== 'DELETE') {
      throw new BadRequestException('Type "DELETE" in the confirm field to permanently delete this admin.');
    }

    const admin = await (this.prisma as any).admin.findUnique({ where: { id } });
    if (!admin) throw new NotFoundException('Admin not found.');

    await (this.prisma as any).admin.delete({ where: { id } });
    return { success: true, message: `Admin ${admin.name} (${admin.email}) permanently deleted.` };
  }

  async resetSubAdminPassword(id: string) {
    const admin = await (this.prisma as any).admin.findUnique({ where: { id } });
    if (!admin) throw new NotFoundException('Admin not found.');

    const newPassword = this.generatePassword();
    const hashed = await bcrypt.hash(newPassword, 10);
    const frontendUrl = this.config.get<string>('FRONTEND_URL') || 'http://localhost:5173';

    await (this.prisma as any).admin.update({
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

  // ─── Volunteer Withdrawal Management ──────────────────────────────────────

  async listWithdrawals(filters: {
    status?: string;
    startDate?: string;
    endDate?: string;
    state?: string | null;
  }) {
    const where: any = {};

    if (filters.status && filters.status !== 'ALL') {
      where.status = filters.status;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    if (filters.state) {
      where.volunteer = { state: filters.state };
    }

    const requests = await (this.prisma as any).withdrawalRequest.findMany({
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

  async getWithdrawalStats(state?: string | null) {
    // Resolve volunteer IDs for the state filter once, then use a scalar IN filter
    // for count queries — avoids aggregate() and nested relation filters both of
    // which can fail when prisma generate has not been re-run after schema changes.
    let volunteerIdFilter: { volunteerId?: { in: string[] } } = {};
    if (state) {
      const vols = await (this.prisma as any).volunteer.findMany({
        where: { state },
        select: { id: true },
      });
      volunteerIdFilter = { volunteerId: { in: (vols as { id: string }[]).map((v) => v.id) } };
    }

    const [pending, approved, paid, rejected, pendingRecords] = await Promise.all([
      (this.prisma as any).withdrawalRequest.count({ where: { status: 'PENDING',  ...volunteerIdFilter } }),
      (this.prisma as any).withdrawalRequest.count({ where: { status: 'APPROVED', ...volunteerIdFilter } }),
      (this.prisma as any).withdrawalRequest.count({ where: { status: 'PAID',     ...volunteerIdFilter } }),
      (this.prisma as any).withdrawalRequest.count({ where: { status: 'REJECTED', ...volunteerIdFilter } }),
      (this.prisma as any).withdrawalRequest.findMany({
        where: { status: 'PENDING', ...volunteerIdFilter },
        select: { amountInr: true },
      }),
    ]);

    const pendingAmountInr = (pendingRecords as { amountInr: number }[])
      .reduce((sum, r) => sum + (r.amountInr || 0), 0);

    return {
      success: true,
      stats: { pending, approved, paid, rejected, pendingAmountInr },
    };
  }

  async approveWithdrawal(id: string, reviewedBy: string, adminNotes?: string) {
    const req = await (this.prisma as any).withdrawalRequest.findUnique({
      where: { id },
      include: { volunteer: { select: { name: true, email: true } } },
    });

    if (!req) throw new NotFoundException('Withdrawal request not found.');
    if (req.status !== 'PENDING') {
      throw new BadRequestException(`Cannot approve a request with status: ${req.status}.`);
    }

    await (this.prisma as any).withdrawalRequest.update({
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

  async rejectWithdrawal(id: string, reviewedBy: string, adminNotes: string) {
    if (!adminNotes?.trim()) {
      throw new BadRequestException('A rejection reason is required.');
    }

    const req = await (this.prisma as any).withdrawalRequest.findUnique({
      where: { id },
      include: { volunteer: { select: { name: true, email: true, id: true } } },
    });

    if (!req) throw new NotFoundException('Withdrawal request not found.');
    if (req.status !== 'PENDING') {
      throw new BadRequestException(`Cannot reject a request with status: ${req.status}.`);
    }

    // Roll back the withdrawn threshold so the volunteer can try again
    await this.prisma.$transaction(async (tx) => {
      await (tx as any).withdrawalRequest.update({
        where: { id },
        data: { status: 'REJECTED', adminNotes, reviewedBy },
      });
      await (tx as any).volunteer.update({
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

  async markWithdrawalPaid(id: string, reviewedBy: string, transactionRef: string, adminNotes?: string) {
    if (!transactionRef?.trim()) {
      throw new BadRequestException('A transaction reference is required.');
    }

    const req = await (this.prisma as any).withdrawalRequest.findUnique({
      where: { id },
      include: { volunteer: { select: { name: true, email: true } } },
    });

    if (!req) throw new NotFoundException('Withdrawal request not found.');
    if (req.status !== 'APPROVED') {
      throw new BadRequestException(`Only APPROVED requests can be marked as paid. Current status: ${req.status}.`);
    }

    await (this.prisma as any).withdrawalRequest.update({
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

  async findAllVolunteers(filters: {
    state?: string | null;
    status?: string;
    search?: string;
  }) {
    const where: any = {};

    if (filters.state) {
      where.state = filters.state;
    }

    if (filters.status === 'ACTIVE') {
      where.isActive = true;
    } else if (filters.status === 'INACTIVE') {
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

    const volunteers = await (this.prisma as any).volunteer.findMany({
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

  async findAllDonors(state?: string | null) {
    // Donors don't have a direct state field; filter via their volunteer record's state if state is set
    const where: any = state
      ? { volunteer: { state } }
      : undefined;

    const donors = await (this.prisma as any).donor.findMany({
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

  private timeAgo(date: Date) {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
  }

  async findAllPrograms() {
    return this.prisma.program.findMany();
  }

  async createProgram(data: any) {
    return this.prisma.program.create({
      data: {
        name: data.name,
        description: data.description,
        targetAmount: data.targetAmount,
      },
    });
  }

  async getStats(range: string = '30D', state?: string | null) {
    const startDate = this.getStartDate(range);
    // Cast to any — volunteer.state is a new field not yet in generated Prisma types
    const stateFilter: any = state ? { donor: { volunteer: { state } } } : {};

    const [totalDonationsSum, donorCount, programCount, recentDonations, historicalDonations] = await Promise.all([
      (this.prisma as any).donation.aggregate({
        where: { status: 'SUCCESS', ...stateFilter },
        _sum: { amount: true },
      }),
      (this.prisma as any).donor.count(state ? { where: { volunteer: { state } } } : undefined),
      this.prisma.program.count(),
      (this.prisma as any).donation.findMany({
        where: { status: 'SUCCESS', ...stateFilter },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { donor: true, program: true },
      }),
      (this.prisma as any).donation.findMany({
        where: {
          status: 'SUCCESS',
          createdAt: { gte: startDate },
          ...stateFilter,
        },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    const chartData = this.aggregateChartData(historicalDonations as any[], range);
    const mappingStats = await this.getMappingStats();

    return {
      totalDonations: (totalDonationsSum as any)?._sum?.amount || 0,
      totalDonors: donorCount,
      totalPrograms: programCount,
      recentDonations,
      chartData,
      mappingStats,
    };
  }

  private getStartDate(range: string): Date {
    const now = new Date();
    if (range === '7D') return new Date(now.setDate(now.getDate() - 7));
    if (range === '1Y') return new Date(now.setFullYear(now.getFullYear() - 1));
    return new Date(now.setDate(now.getDate() - 30));
  }

  private aggregateChartData(donations: any[], range: string) {
    const data: any[] = [];
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
    } else {
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

  private async getMappingStats() {
    // Treat donors with more than 1 successful donation as 'recurring' for the UI stats
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

  async findAllDonations(filters: {
    startDate?: string;
    endDate?: string;
    programId?: string;
    donorSearch?: string;
    status?: string;
    state?: string | null;
  }) {
    const where: any = {};

    if (filters.status && filters.status !== 'ALL') {
      where.status = filters.status;
    }

    if (filters.programId) {
      where.programId = filters.programId;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
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

    return (this.prisma as any).donation.findMany({
      where,
      include: { donor: true, program: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }
}
