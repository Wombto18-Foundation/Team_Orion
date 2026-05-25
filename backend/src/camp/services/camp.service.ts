import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/services/prisma.service';
import { CoinService } from '../../coin/services/coin.service';
import { MailerService } from '../../auth/services/mailer.service';
import { CertificateService } from '../../certificate/services/certificate.service';
import { WhatsappService } from '../../whatsapp/whatsapp.service';

@Injectable()
export class CampService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly coinService: CoinService,
    private readonly mailerService: MailerService,
    private readonly certificateService: CertificateService,
    private readonly whatsappService: WhatsappService,
  ) {}

  //Create a new camp
  async createCamp(data: {
    name: string;
    description: string;
    location: string;
    date: string;
    endDate?: string;
    assignedAdminId?: string;
    totalCoinPool?: number;
    purpose?: string;
  }) {
    const expired = new Date(Date.now() - 10 * 60 * 1000);
    return this.prisma.camp.create({
      data: {
        name: data.name,
        description: data.description,
        location: data.location,
        date: new Date(data.date),
        endDate: data.endDate ? new Date(data.endDate) : null,
        assignedAdminId: data.assignedAdminId,
        totalCoinPool: data.totalCoinPool || 0,
        purpose: data.purpose || "HEALTH",
        activeQrExpiry: expired,
        activeQrRotatedAt: new Date(0),
      },
    });
  }

  private async getActualVolunteerId(volunteerIdentifier: string): Promise<string> {
    const vol = await this.prisma.volunteer.findFirst({
      where: {
        OR: [
          { id: volunteerIdentifier },
          { volunteerId: volunteerIdentifier },
        ],
      },
    });
    if (!vol) throw new NotFoundException('Volunteer record not found');
    return vol.id;
  }

  private async loadCamp(campId: string): Promise<any> {
    const camp = await this.prisma.camp.findUnique({ where: { id: campId } });
    if (!camp) throw new NotFoundException('Camp not found');
    return camp;
  }

  private isCampDay(campDate: Date) {
    const timeZone = 'Asia/Kolkata';
    const formatter = new Intl.DateTimeFormat('en-CA', { 
      timeZone, 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    });
    
    const todayIST = formatter.format(new Date());
    const campIST = formatter.format(new Date(campDate));
    
    // If dates match in IST, it's definitely camp day
    if (todayIST === campIST) return true;

    // Leniency: Allow activation if within 24 hours of scheduled time
    const diffHours = (new Date().getTime() - new Date(campDate).getTime()) / (3600000);
    return diffHours >= -5 && diffHours <= 24; // 5 hours before (near midnight) to 24 hours after
  }

  private getFrontendUrl() {
    return process.env.FRONTEND_URL || 'http://localhost:5173';
  }

  private buildAttendanceLink(token: string) {
    return `${this.getFrontendUrl()}/scan?token=${encodeURIComponent(token)}`;
  }

  private getVolunteerCampLink(volunteerId: string) {
    return `${this.getFrontendUrl()}/volunteer/${encodeURIComponent(volunteerId)}/camps`;
  }

  private getDayDiff(campDate: Date) {
    const camp = new Date(campDate);
    const today = new Date();
    camp.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return Math.round((camp.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
  }

  private formatCampDate(campDate: Date) {
    return new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
    }).format(new Date(campDate));
  }

  private async hasCampNotification(volunteerId: string, type: string, campId: string) {
    const notificationModel = (this.prisma as any).notification;
    if (!notificationModel?.findFirst) return false;

    const existing = await notificationModel.findFirst({
      where: {
        volunteerId,
        type,
        metadata: {
          contains: `"campId":"${campId}"`,
        },
      },
      select: { id: true },
    });

    return !!existing;
  }

  private async syncCampLifecycleEmails() {
    const camps: any[] = await this.prisma.camp.findMany({
      include: {
        participations: {
          include: { volunteer: true },
        },
      },
    });

    for (const camp of camps) {
      const diffDays = this.getDayDiff(camp.date);
      if (diffDays === 1) {
        await this.sendTomorrowReminders(camp);
      } else if (diffDays < 0) {
        await this.sendPostCampFollowUps(camp);
      }
    }
  }

  private async sendTomorrowReminders(camp: any) {
    const participations = camp.participations.filter((p: any) => p.status === 'APPROVED' || p.status === 'ATTENDED');
    for (const participation of participations) {
      if (participation.volunteerResponse === 'NOT_JOINING') continue;
      const volunteer = participation.volunteer;
      if (!volunteer?.email) continue;

      const alreadySent = await this.hasCampNotification(volunteer.id, 'CAMP_TOMORROW_REMINDER', camp.id);
      if (alreadySent) continue;

      const message = participation.volunteerResponse === 'JOINING'
        ? `Thanks for confirming. Your camp is tomorrow, so please be prepared, keep your phone charged, and arrive on time for ${camp.name}.`
        : `Your camp is tomorrow. Please be prepared for ${camp.name}, keep your phone charged, and review your dashboard for any last-minute updates.`;

      await (this.prisma as any).notification.create({
        data: {
          volunteerId: volunteer.id,
          type: 'CAMP_TOMORROW_REMINDER',
          title: `Your camp is tomorrow: ${camp.name}`,
          message,
          link: this.getVolunteerCampLink(volunteer.volunteerId),
          metadata: JSON.stringify({
            campId: camp.id,
            campName: camp.name,
            reminderType: 'TOMORROW',
          }),
        },
      });

      await this.mailerService.sendCampReminderEmail({
        email: volunteer.email,
        volunteerName: volunteer.name,
        campName: camp.name,
        campDate: this.formatCampDate(camp.date),
        message,
        link: this.getVolunteerCampLink(volunteer.volunteerId),
      });
    }

    // Bulk WhatsApp camp reminder (fire-and-forget, single API call for all volunteers)
    const whatsappRecipients = participations
      .filter((p: any) => p.volunteerResponse !== 'NOT_JOINING' && p.volunteer?.mobile)
      .map((p: any) => ({
        mobile: p.volunteer.mobile,
        name: p.volunteer.name || 'Volunteer',
        campName: camp.name,
        campLink: this.getVolunteerCampLink(p.volunteer.volunteerId),
      }));

    if (whatsappRecipients.length > 0) {
      console.log(`[CampService] Sending bulk WhatsApp camp reminder to ${whatsappRecipients.length} volunteer(s)`);
      this.whatsappService.sendCampReminderBulk(whatsappRecipients);
    }
  }

  private async sendPostCampFollowUps(camp: any) {
    const participations = camp.participations.filter((p: any) => p.status === 'APPROVED' || p.status === 'ATTENDED');
    for (const participation of participations) {
      if (participation.volunteerResponse !== 'NOT_JOINING') continue;
      const volunteer = participation.volunteer;
      if (!volunteer?.email) continue;

      const alreadySent = await this.hasCampNotification(volunteer.id, 'CAMP_NO_JOIN_FOLLOWUP', camp.id);
      if (alreadySent) continue;

      const message = `We saw that you couldn't join ${camp.name}. Thank you for letting us know in advance. We appreciate your honesty and would love to welcome you at the next camp.`;

      await (this.prisma as any).notification.create({
        data: {
          volunteerId: volunteer.id,
          type: 'CAMP_NO_JOIN_FOLLOWUP',
          title: `A warm note after ${camp.name}`,
          message,
          metadata: JSON.stringify({
            campId: camp.id,
            campName: camp.name,
            followUpType: 'NOT_JOINING',
          }),
        },
      });

      await this.mailerService.sendCampFollowUpEmail({
        email: volunteer.email,
        volunteerName: volunteer.name,
        campName: camp.name,
        campDate: this.formatCampDate(camp.date),
        message,
      });
    }
  }

  // Volunteer registers for a camp -> PENDING
  async registerCamp(campId: string, volunteerId: string) {
    const actualVolunteerId = await this.getActualVolunteerId(volunteerId);
    const camp = await this.loadCamp(campId);

    const todayStr = new Date().toDateString();
    const campDateStr = camp.date.toDateString();
    if (new Date() > camp.date && todayStr !== campDateStr) {
      throw new BadRequestException('Cannot register for a past camp');
    }

    const existing: any = await this.prisma.campParticipation.findUnique({
      where: { campId_volunteerId: { campId, volunteerId: actualVolunteerId } },
    });

    if (existing) {
      throw new BadRequestException(`You have already registered. Status: ${existing.status}`);
    }

    return (this.prisma as any).campParticipation.create({
      data: {
        campId,
        volunteerId: actualVolunteerId,
        participationType: 'NORMAL',
        status: 'PENDING',
        shareSelected: false,
        volunteerResponse: 'UNRESPONDED',
      },
    });
  }

  async updateVolunteerResponse(campId: string, volunteerId: string, response: 'JOINING' | 'NOT_JOINING') {
    const actualVolunteerId = await this.getActualVolunteerId(volunteerId);
    const existing: any = await this.prisma.campParticipation.findUnique({
      where: { campId_volunteerId: { campId, volunteerId: actualVolunteerId } },
    });

    if (!existing) throw new NotFoundException('Registration record not found');
    if (existing.status !== 'APPROVED' && existing.status !== 'ATTENDED') {
      throw new BadRequestException('You can only RSVP after your registration is approved.');
    }

    return (this.prisma as any).campParticipation.update({
      where: { id: existing.id },
      data: {
        volunteerResponse: response,
        responseAt: new Date(),
        shareSelected: response === 'NOT_JOINING' ? false : existing.shareSelected,
      },
    });
  }

  //Admin approves/rejects a registration
  async updateRegistrationStatus(campId: string, volunteerId: string, status: 'APPROVED' | 'REJECTED') {
    const actualVolunteerId = await this.getActualVolunteerId(volunteerId);
    const existing: any = await this.prisma.campParticipation.findUnique({
      where: { campId_volunteerId: { campId, volunteerId: actualVolunteerId } },
    });
    if (!existing) throw new NotFoundException('Registration record not found');

    return this.prisma.campParticipation.update({
      where: { id: existing.id },
      data: { status },
    });
  }

  // Admin selects or unselects a volunteer for camp attendance sharing
  async updateShareSelection(
    campId: string,
    volunteerId: string,
    shareSelected: boolean,
  ) {
    const actualVolunteerId = await this.getActualVolunteerId(volunteerId);
    const existing: any = await this.prisma.campParticipation.findUnique({
      where: { campId_volunteerId: { campId, volunteerId: actualVolunteerId } },
    });

    if (!existing) throw new NotFoundException('Registration record not found');
    if (existing.status !== 'APPROVED' && existing.status !== 'ATTENDED') {
      throw new BadRequestException('Approve the volunteer before selecting them for attendance sharing.');
    }
    if (existing.volunteerResponse === 'NOT_JOINING') {
      throw new BadRequestException('This volunteer marked themselves as not joining this camp.');
    }

    return (this.prisma as any).campParticipation.update({
      where: { id: existing.id },
      data: { shareSelected },
    });
  }

  async getQrTokens(campId: string) {
    const camp = await this.loadCamp(campId);

    return {
      attendance: { token: camp.activeQrToken, expiry: camp.activeQrExpiry },
    };
  }

  // Get camp with its single QR token (admin view)
  async getCampAdmin(campId: string) {
    const camp: any = await this.prisma.camp.findUnique({
      where: { id: campId },
      include: {
        participations: {
          include: { volunteer: { select: { volunteerId: true, name: true, city: true, email: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!camp) throw new NotFoundException('Camp not found');

    const now = new Date();
    const isActive = !!camp.activeQrExpiry && camp.activeQrExpiry > now;
    const tokens = { attendance: { token: camp.activeQrToken, expiry: camp.activeQrExpiry } };

    const approvedCount = camp.participations.filter(p => p.status === 'APPROVED' || p.status === 'ATTENDED').length;
    const selectedCount = camp.participations.filter(p => p.shareSelected && p.volunteerResponse !== 'NOT_JOINING').length;
    const attendedCount = camp.participations.filter(p => p.status === 'ATTENDED').length;
    const joiningCount = camp.participations.filter(p => p.volunteerResponse === 'JOINING').length;
    const notJoiningCount = camp.participations.filter(p => p.volunteerResponse === 'NOT_JOINING').length;
    const undecidedCount = camp.participations.filter(p => p.volunteerResponse === 'UNRESPONDED').length;

    // Calculate per-head coin distribution
    const pool = camp.totalCoinPool || 0;
    const divisor = joiningCount > 0 ? joiningCount : (approvedCount > 0 ? approvedCount : 1);
    const coinsPerVolunteer = pool > 0 ? Math.floor(pool / divisor) : 100;

    const isExpired = new Date() > new Date(camp.date.getTime() + 24 * 60 * 60 * 1000);

    return {
      camp: {
        ...camp,
        status: isExpired ? 'COMPLETED' : camp.status,
      },
      qrCodes: {
        attendance: {
          token: tokens.attendance.token,
          url: this.buildAttendanceLink(tokens.attendance.token),
          label: `${coinsPerVolunteer} Coin Attendance QR`,
        },
      },
      stats: {
        totalParticipants: approvedCount,
        selectedParticipants: selectedCount,
        attendedParticipants: attendedCount,
        joiningParticipants: joiningCount,
        notJoiningParticipants: notJoiningCount,
        undecidedParticipants: undecidedCount,
        windowState: isActive ? 'ACTIVE' : 'INACTIVE',
        totalCoinPool: pool,
        coinsPerVolunteer,
      },
    };
  }

  // Notify selected and unselected volunteers when the attendance window is opened
  private async notifyCampWindowOpened(campId: string, attendanceLink: string) {
    const camp: any = await this.prisma.camp.findUnique({
      where: { id: campId },
      include: {
        participations: {
          include: {
            volunteer: true,
          },
        },
      },
    });

    if (!camp) throw new NotFoundException('Camp not found');

    const recipients = camp.participations.filter(p => p.status === 'APPROVED' || p.status === 'ATTENDED');

    for (const participation of recipients) {
      const selected = participation.shareSelected === true;
      const volunteer = participation.volunteer;
      if (!volunteer?.email) continue;

      const title = selected
        ? `Your attendance link is ready for ${camp.name}`
        : `More camps are coming soon`;

      const message = selected
        ? `You have been selected for the ${camp.name} attendance window. Use the link below within 10 minutes to mark attendance and receive 100 coins.`
        : `You were not selected for the current attendance window for ${camp.name}, but more camp opportunities are coming soon. Keep checking your dashboard for updates.`;

      await (this.prisma as any).notification.create({
        data: {
          volunteerId: volunteer.id,
          type: selected ? 'CAMP_INVITE' : 'CAMP_UPDATE',
          title,
          message,
          link: selected ? attendanceLink : null,
          metadata: JSON.stringify({
            campId: camp.id,
            campName: camp.name,
            selected,
          }),
        },
      });

      await this.mailerService.sendCampNotificationEmail({
        email: volunteer.email,
        volunteerName: volunteer.name,
        campName: camp.name,
        message,
        link: selected ? attendanceLink : undefined,
        selected,
      });
    }

    return { notified: recipients.length };
  }

  // Open the single 100-coin attendance QR for 10 minutes
  async activateAttendance(campId: string) {
    const camp = await this.loadCamp(campId);
    if (!this.isCampDay(camp.date)) {
      const timeZone = 'Asia/Kolkata';
      const formatter = new Intl.DateTimeFormat('en-IN', { timeZone, dateStyle: 'medium', timeStyle: 'short' });
      throw new BadRequestException(`Camp activation is restricted to the scheduled day. Scheduled: ${formatter.format(new Date(camp.date))} IST. Current: ${formatter.format(new Date())} IST.`);
    }

    const selectedCount = await (this.prisma as any).campParticipation.count({
      where: {
        campId,
        status: 'APPROVED',
        shareSelected: true,
      },
    });

    if (selectedCount === 0) {
      throw new BadRequestException('Attendance cannot be activated without selecting at least one APPROVED volunteer.');
    }

    const token = `attendance-${randomUUID()}`;
    const expiry = new Date(Date.now() + 10 * 60 * 1000);
    await this.prisma.camp.update({
      where: { id: campId },
      data: {
        activeQrToken: token,
        activeQrExpiry: expiry,
        activeQrRotatedAt: new Date(),
      },
    });

    const attendanceLink = this.buildAttendanceLink(token);
    await this.notifyCampWindowOpened(campId, attendanceLink);

    return {
      token,
      expiry,
      attendanceLink,
      selectedCount,
    };
  }

  //Unified Scan QR endpoint
  async scanQr(token: string, volunteerId: string) {
    const actualVolunteerId = await this.getActualVolunteerId(volunteerId);
    const camp: any = await this.prisma.camp.findUnique({ where: { activeQrToken: token } });

    if (!camp) throw new NotFoundException('Invalid QR code');

    const now = new Date();
    const todayStr = new Date().toDateString();
    const campDateStr = camp.date.toDateString();
    if (new Date() > camp.date && todayStr !== campDateStr) {
      throw new BadRequestException('This camp has expired.');
    }

    if (!camp.activeQrExpiry || camp.activeQrExpiry < now) {
      throw new BadRequestException('QR token has expired');
    }

    const existing: any = await this.prisma.campParticipation.findUnique({
      where: { campId_volunteerId: { campId: camp.id, volunteerId: actualVolunteerId } },
    });

    if (!existing) {
      throw new BadRequestException('You must register for this camp before scanning the QR.');
    }
    if (existing.status === 'PENDING') {
      throw new BadRequestException('Your registration is pending approval by the admin.');
    }
    if (existing.status === 'REJECTED') {
      throw new BadRequestException('Your registration for this camp was declined.');
    }
    if (!existing.shareSelected) {
      throw new BadRequestException('Your attendance link has not been shared by the admin yet.');
    }
    if (existing.status === 'ATTENDED') {
      throw new BadRequestException('You have already scanned attendance for this camp');
    }

    await this.prisma.campParticipation.update({
      where: { id: existing.id },
      data: { status: 'ATTENDED' },
    });

    // Trigger automated certificate generation
    try {
      await this.certificateService.generateAutomatedCampCertificate(actualVolunteerId, camp.id);
    } catch (certErr) {
      console.error('Failed to generate automated camp certificate:', certErr);
    }

    return this.coinService.awardCampActiveCoins(actualVolunteerId, camp.id);
  }

  //Forcefully close the digital attendance channel before expiry
  async closeDigitalChannels(campId: string) {
    await this.loadCamp(campId);
    return this.prisma.camp.update({
      where: { id: campId },
      data: {
        activeQrExpiry: new Date(Date.now() - 1000),
      },
    });
  }

  //Volunteer processes their attendance via the shared link
  async scanDigital(campId: string, volunteerId: string) {
    const actualVolunteerId = await this.getActualVolunteerId(volunteerId);

    const existing: any = await this.prisma.campParticipation.findUnique({
      where: { campId_volunteerId: { campId, volunteerId: actualVolunteerId } },
      include: { camp: true },
    });

    if (!existing || !existing.camp) {
      throw new BadRequestException('Participation record not found.');
    }

    if (existing.status !== 'APPROVED') {
      if (existing.status === 'ATTENDED') throw new BadRequestException('You have already successfully marked attendance for this camp!');
      if (existing.status === 'PENDING') throw new BadRequestException('You cannot mark attendance until an Admin formally approves your registration.');
      if (existing.status === 'REJECTED') throw new BadRequestException('Your registration was declined for this camp.');
      throw new BadRequestException('You are not cleared for attendance.');
    }

    if (!existing.shareSelected) {
      throw new BadRequestException('The admin has not shared the attendance link with you yet.');
    }

    const camp = existing.camp;
    const now = new Date();
    if (!camp.activeQrExpiry || camp.activeQrExpiry < now) {
      throw new BadRequestException('The 10-minute attendance window has expired. Admin must reactivate.');
    }

    await this.prisma.campParticipation.update({
      where: { id: existing.id },
      data: { status: 'ATTENDED' },
    });

    // Trigger automated certificate generation
    try {
      await this.certificateService.generateAutomatedCampCertificate(actualVolunteerId, camp.id);
    } catch (certErr) {
      console.error('Failed to generate automated camp certificate:', certErr);
    }

    return this.coinService.awardCampActiveCoins(actualVolunteerId, camp.id);
  }

  //Get Full Camp Detail (Participant list, stats)
  async getCampDetail(campId: string) {
    return this.getCampAdmin(campId);
  }

  //List all camps (upcoming, active, completed)
  async listCamps(status?: string, page?: number, limit?: number, state?: string) {
    const where: any = state ? { state } : {};
    const camps = await this.prisma.camp.findMany({
      where,
      orderBy: page && limit ? { createdAt: 'desc' } : { date: 'asc' },
      include: { _count: { select: { participations: true } } },
    });

    const todayStr = new Date().toDateString();
    const mapped = camps.map(camp => {
      const isExpired = new Date() > camp.date && todayStr !== camp.date.toDateString();
      return { ...camp, status: isExpired ? 'COMPLETED' : camp.status };
    });

    const filtered = status ? mapped.filter(c => c.status === status) : mapped;

    await this.syncCampLifecycleEmails();

    if (page && limit) {
      const safePage = Math.max(1, Math.floor(page));
      const safeLimit = Math.max(1, Math.floor(limit));
      const total = filtered.length;
      const totalPages = Math.max(1, Math.ceil(total / safeLimit));
      const start = (safePage - 1) * safeLimit;

      return {
        items: filtered.slice(start, start + safeLimit),
        total,
        page: safePage,
        limit: safeLimit,
        totalPages,
      };
    }

    return filtered;
  }

  //List upcoming camps for volunteers
  async getUpcomingCamps() {
    const list = (await this.listCamps()) as any[];
    return list.filter(c => c.status === 'UPCOMING' || c.status === 'ACTIVE');
  }

  //Update camp status (admin)
  async updateStatus(campId: string, status: string) {
    return this.prisma.camp.update({
      where: { id: campId },
      data: { status },
    });
  }
}
