import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/services/prisma.service';
import { CoinService } from '../../coin/services/coin.service';
import { CertificateService } from '../../certificate/services/certificate.service';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

@Injectable()
export class OrganizerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly coinService: CoinService,
    private readonly certificateService: CertificateService,
  ) {}

  async login(email: string, password: string) {
    const organizer = await (this.prisma as any).campOrganizer.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!organizer) throw new BadRequestException('Invalid email or password.');

    if (!organizer.isActive) {
      throw new ForbiddenException('Your account has been deactivated. Contact support@wombto18.org');
    }

    if (organizer.accessExpiresAt && new Date() > new Date(organizer.accessExpiresAt)) {
      throw new ForbiddenException('Your dashboard access has expired.');
    }

    const valid = await bcrypt.compare(password, organizer.password);
    if (!valid) throw new BadRequestException('Invalid email or password.');

    await (this.prisma as any).campOrganizer.update({
      where: { id: organizer.id },
      data: { lastLoginAt: new Date() },
    });

    const payload = {
      sub: organizer.id,
      email: organizer.email,
      role: 'CAMP_ORGANIZER',
      campId: organizer.campId,
      hasChangedPassword: organizer.hasChangedPassword,
    };
    const token = this.jwt.sign(payload);

    return {
      success: true,
      token,
      name: organizer.name,
      role: 'CAMP_ORGANIZER',
      campId: organizer.campId,
      hasChangedPassword: organizer.hasChangedPassword,
      firstLogin: !organizer.hasChangedPassword,
      accessExpiresAt: organizer.accessExpiresAt,
      redirect: organizer.hasChangedPassword ? `/organizer/dashboard` : '/organizer/set-password',
    };
  }

  async setPassword(
    organizerId: string,
    newPassword: string,
    confirmPassword: string,
    totalCoinPool?: number,
  ) {
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Passwords do not match.');
    }
    if (!PASSWORD_REGEX.test(newPassword)) {
      throw new BadRequestException('Password must be at least 8 characters with at least one uppercase letter and one number.');
    }
    if (!totalCoinPool || totalCoinPool < 100) {
      throw new BadRequestException('A coin prize pool of at least 100 coins is required.');
    }

    const organizer = await (this.prisma as any).campOrganizer.findUnique({ where: { id: organizerId } });
    if (!organizer) throw new NotFoundException('Organizer not found.');
    if (organizer.hasChangedPassword) {
      throw new BadRequestException('Password has already been set. Use the change-password flow.');
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await (this.prisma as any).campOrganizer.update({
      where: { id: organizerId },
      data: { password: hashed, hasChangedPassword: true },
    });

    if (organizer.campId) {
      await this.prisma.camp.update({
        where: { id: organizer.campId },
        data: { totalCoinPool },
      });
    }

    const payload = {
      sub: organizer.id,
      email: organizer.email,
      role: 'CAMP_ORGANIZER',
      campId: organizer.campId,
      hasChangedPassword: true,
    };
    const token = this.jwt.sign(payload);

    return { success: true, token, redirect: '/organizer/dashboard' };
  }

  async updateCoinPool(campId: string, totalCoinPool: number) {
    if (!totalCoinPool || totalCoinPool < 100) {
      throw new BadRequestException('Coin pool must be at least 100.');
    }
    await this.prisma.camp.update({ where: { id: campId }, data: { totalCoinPool } });
    return { success: true, totalCoinPool };
  }

  async getCampDashboard(_organizerId: string, campId: string) {
    const camp = await (this.prisma as any).camp.findUnique({
      where: { id: campId },
      include: {
        participations: {
          select: {
            id: true,
            participationType: true,
            status: true,
            volunteerResponse: true,
            coinsAwarded: true,
            scannedAt: true,
            volunteer: {
              select: { id: true, volunteerId: true, name: true, email: true, mobile: true },
            },
          },
        },
      },
    });

    if (!camp) throw new NotFoundException('Camp not found.');

    const stats = {
      total: camp.participations.length,
      joining: camp.participations.filter((p: any) => p.volunteerResponse === 'JOINING').length,
      attended: camp.participations.filter((p: any) => p.status === 'ATTENDED').length,
      pending: camp.participations.filter((p: any) => p.volunteerResponse === 'UNRESPONDED').length,
    };

    return { success: true, camp, stats };
  }

  async getParticipants(campId: string) {
    const participations = await (this.prisma as any).campParticipation.findMany({
      where: { campId },
      include: {
        volunteer: {
          select: { id: true, volunteerId: true, name: true, email: true, mobile: true, city: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, participants: participations };
  }

  async updateRegistrationStatus(campId: string, volunteerId: string, status: 'APPROVED' | 'REJECTED') {
    const participation = await (this.prisma as any).campParticipation.findFirst({
      where: { campId, volunteer: { volunteerId } },
    });
    if (!participation) throw new NotFoundException('Participation record not found.');

    await (this.prisma as any).campParticipation.update({
      where: { id: participation.id },
      data: { status },
    });

    return { success: true, message: `Registration ${status.toLowerCase()}.` };
  }

  async updateShareSelection(campId: string, volunteerId: string, selected: boolean) {
    const participation = await (this.prisma as any).campParticipation.findFirst({
      where: { campId, volunteer: { volunteerId } },
    });
    if (!participation) throw new NotFoundException('Volunteer not found in this camp.');
    if (participation.status === 'REJECTED') {
      throw new BadRequestException('Cannot select a rejected volunteer.');
    }
    if (selected && participation.volunteerResponse === 'NOT_JOINING') {
      throw new BadRequestException('Cannot select a volunteer who has opted out.');
    }

    await (this.prisma as any).campParticipation.update({
      where: { id: participation.id },
      data: { shareSelected: selected },
    });

    return { success: true, shareSelected: selected };
  }

  // ─── Attendance window (DB-backed, 10-min TTL) ────────────────────────────

  private isCampDay(campDate: Date): boolean {
    const timeZone = 'Asia/Kolkata';
    const fmt = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' });
    if (fmt.format(new Date()) === fmt.format(campDate)) return true;
    const diffHours = (Date.now() - new Date(campDate).getTime()) / 3_600_000;
    return diffHours >= -5 && diffHours <= 24;
  }

  async activateAttendance(campId: string) {
    const camp = await (this.prisma as any).camp.findUnique({
      where: { id: campId },
      select: { date: true, name: true },
    });
    if (!camp) throw new NotFoundException('Camp not found.');

    if (!this.isCampDay(new Date(camp.date))) {
      const fmt = new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'medium',
        timeStyle: 'short',
      });
      throw new BadRequestException(
        `Attendance can only be activated on the day of the camp. Camp is scheduled for ${fmt.format(new Date(camp.date))} IST.`,
      );
    }

    const selectedCount = await (this.prisma as any).campParticipation.count({
      where: { campId, status: 'APPROVED', shareSelected: true },
    });
    if (selectedCount === 0) {
      throw new BadRequestException('Select at least one approved volunteer before activating attendance.');
    }

    const token = `attendance-${randomUUID()}`;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.camp.update({
      where: { id: campId },
      data: { activeQrToken: token, activeQrExpiry: expiresAt },
    });

    return { active: true, token, expiresAt };
  }

  async closeAttendance(campId: string) {
    await this.prisma.camp.update({
      where: { id: campId },
      data: { activeQrExpiry: new Date(Date.now() - 1000) },
    });
    return { active: false };
  }

  async getAttendanceStatus(campId: string) {
    const camp = await (this.prisma as any).camp.findUnique({
      where: { id: campId },
      select: { activeQrToken: true, activeQrExpiry: true },
    });

    if (!camp?.activeQrToken || !camp.activeQrExpiry || new Date() > new Date(camp.activeQrExpiry)) {
      return { active: false };
    }

    const attended = await (this.prisma as any).campParticipation.findMany({
      where: { campId, status: 'ATTENDED' },
      include: { volunteer: { select: { name: true } } },
      orderBy: { scannedAt: 'desc' },
    });

    return {
      active: true,
      token: camp.activeQrToken,
      expiresAt: camp.activeQrExpiry,
      scans: attended.map((p: any) => ({
        name: p.volunteer?.name ?? 'Unknown',
        scannedAt: p.scannedAt ?? new Date(),
      })),
    };
  }

  async processAttendanceScan(campId: string, token: string, volunteerUid: string) {
    const camp = await (this.prisma as any).camp.findUnique({
      where: { id: campId },
      select: { activeQrToken: true, activeQrExpiry: true },
    });

    if (!camp?.activeQrToken || !camp.activeQrExpiry || new Date() > new Date(camp.activeQrExpiry)) {
      throw new ForbiddenException('Attendance window is not active.');
    }
    if (camp.activeQrToken !== token) throw new ForbiddenException('Invalid attendance token.');

    const participation = await (this.prisma as any).campParticipation.findFirst({
      where: { campId, volunteer: { volunteerId: volunteerUid } },
      include: { volunteer: { select: { id: true, name: true } } },
    });

    if (!participation) throw new NotFoundException('You are not registered for this camp.');
    if (participation.status === 'ATTENDED') return { success: false, message: 'Already marked as attended.' };
    if (participation.status !== 'APPROVED') throw new ForbiddenException('Your registration has not been approved.');
    if (!participation.shareSelected) throw new ForbiddenException('Your attendance link has not been shared yet.');

    await (this.prisma as any).campParticipation.update({
      where: { id: participation.id },
      data: { status: 'ATTENDED', scannedAt: new Date() },
    });

    try {
      await this.certificateService.generateAutomatedCampCertificate(participation.volunteer.id, campId);
    } catch {
      // Certificate generation is non-blocking
    }

    try {
      const coinResult = await this.coinService.awardCampActiveCoins(participation.volunteer.id, campId);
      return { success: true, message: `Attendance marked for ${participation.volunteer.name}.`, ...coinResult };
    } catch {
      return { success: true, message: `Attendance marked for ${participation.volunteer.name}.` };
    }
  }
}
