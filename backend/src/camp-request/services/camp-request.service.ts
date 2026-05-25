import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/services/prisma.service';
import { MailerService } from '../../auth/services/mailer.service';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

@Injectable()
export class CampRequestService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailer: MailerService,
    private readonly config: ConfigService,
  ) {}

  private generatePassword(length = 12): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!';
    return Array.from(crypto.randomBytes(length))
      .map((b) => chars[b % chars.length])
      .join('');
  }

  async submitRequest(data: {
    requesterName: string;
    requesterEmail: string;
    requesterPhone: string;
    organizationName?: string;
    state: string;
    district: string;
    address: string;
    campType: string;
    expectedDate: string;
    durationDays?: number;
    expectedParticipants: number;
    description?: string;
  }) {
    const required = ['requesterName', 'requesterEmail', 'requesterPhone', 'state', 'district', 'address', 'campType', 'expectedDate', 'expectedParticipants'] as const;
    for (const field of required) {
      if (!data[field]) throw new BadRequestException(`${field} is required.`);
    }

    const campRequest = await (this.prisma as any).campRequest.create({
      data: {
        requesterName: data.requesterName.trim(),
        requesterEmail: data.requesterEmail.toLowerCase().trim(),
        requesterPhone: data.requesterPhone.trim(),
        organizationName: data.organizationName?.trim() || null,
        state: data.state.trim(),
        district: data.district.trim(),
        address: data.address.trim(),
        campType: data.campType,
        expectedDate: new Date(data.expectedDate),
        durationDays: data.durationDays || 1,
        expectedParticipants: Number(data.expectedParticipants),
        description: data.description?.trim() || null,
        status: 'PENDING',
      },
    });

    await this.mailer.sendCampRequestAcknowledgmentEmail({
      email: campRequest.requesterEmail,
      name: campRequest.requesterName,
      campType: campRequest.campType,
      district: campRequest.district,
      state: campRequest.state,
    });

    return {
      success: true,
      message: 'Your camp request has been submitted. We will review it within 3–5 working days.',
      requestId: campRequest.id,
    };
  }

  async listRequests(filters: {
    status?: string;
    state?: string | null;
    campType?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const where: any = {};
    if (filters.status && filters.status !== 'ALL') where.status = filters.status;
    if (filters.state) where.state = filters.state;
    if (filters.campType) where.campType = filters.campType;
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    const requests = await (this.prisma as any).campRequest.findMany({
      where,
      include: {
        organizer: {
          select: { id: true, email: true, isActive: true, accessExpiresAt: true, hasChangedPassword: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 300,
    });

    return { success: true, requests };
  }

  async getRequestById(id: string) {
    const request = await (this.prisma as any).campRequest.findUnique({
      where: { id },
      include: {
        organizer: {
          select: { id: true, email: true, campId: true, isActive: true, accessExpiresAt: true, hasChangedPassword: true, lastLoginAt: true },
        },
      },
    });
    if (!request) throw new NotFoundException('Camp request not found.');
    return { success: true, request };
  }

  async approveRequest(id: string, reviewedBy: string) {
    const request = await (this.prisma as any).campRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Camp request not found.');
    if (request.status !== 'PENDING') {
      throw new BadRequestException(`Cannot approve a request with status: ${request.status}.`);
    }

    const rawPassword = this.generatePassword();
    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    const frontendUrl = this.config.get<string>('FRONTEND_URL') || 'http://localhost:5173';

    // Calculate dates
    const campDate = new Date(request.expectedDate);
    const campEndDate = new Date(campDate);
    campEndDate.setDate(campEndDate.getDate() + (request.durationDays || 1));
    const accessExpiresAt = new Date(campEndDate);
    accessExpiresAt.setDate(accessExpiresAt.getDate() + 1); // +1 day after camp ends

    const campName = `${request.requesterName}'s ${request.campType} Camp`;

    const result = await this.prisma.$transaction(async (tx) => {
      // Step 1 — Create Camp
      const camp = await (tx as any).camp.create({
        data: {
          name: campName,
          description: request.description || `${request.campType} camp organised by ${request.requesterName}`,
          location: request.address,
          date: campDate,
          endDate: campEndDate,
          purpose: request.campType,
          organizerType: 'ORGANIZER',
          state: request.state,
          status: 'UPCOMING',
        },
      });

      // Step 2 — Create CampOrganizer
      const organizer = await (tx as any).campOrganizer.create({
        data: {
          email: request.requesterEmail,
          password: hashedPassword,
          name: request.requesterName,
          phone: request.requesterPhone,
          state: request.state,
          campId: camp.id,
          campRequestId: request.id,
          accessExpiresAt,
          isActive: true,
          hasChangedPassword: false,
        },
      });

      // Step 3 — Update Camp with organizerId
      await (tx as any).camp.update({
        where: { id: camp.id },
        data: { campOrganizerId: organizer.id },
      });

      // Step 4 — Update CampRequest
      await (tx as any).campRequest.update({
        where: { id },
        data: { status: 'APPROVED', reviewedBy, organizerId: organizer.id },
      });

      return { camp, organizer };
    });

    // Step 5 — Send approval email
    const fmt = (d: Date) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    await this.mailer.sendCampRequestApprovedEmail({
      email: request.requesterEmail,
      name: request.requesterName,
      campName,
      campDate: fmt(campDate),
      campEndDate: fmt(campEndDate),
      loginUrl: `${frontendUrl}/organizer/login`,
      password: rawPassword,
      accessExpiresAt: fmt(accessExpiresAt),
    });

    return {
      success: true,
      message: 'Camp request approved. Organizer account created and credentials emailed.',
      campId: result.camp.id,
      organizerId: result.organizer.id,
    };
  }

  async rejectRequest(id: string, reviewedBy: string, adminNotes: string) {
    if (!adminNotes?.trim()) throw new BadRequestException('A rejection reason is required.');

    const request = await (this.prisma as any).campRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Camp request not found.');
    if (request.status !== 'PENDING') {
      throw new BadRequestException(`Cannot reject a request with status: ${request.status}.`);
    }

    await (this.prisma as any).campRequest.update({
      where: { id },
      data: { status: 'REJECTED', reviewedBy, adminNotes: adminNotes.trim() },
    });

    await this.mailer.sendCampRequestRejectedEmail({
      email: request.requesterEmail,
      name: request.requesterName,
      district: request.district,
      state: request.state,
      adminNotes: adminNotes.trim(),
    });

    return { success: true, message: 'Camp request rejected and requester notified.' };
  }
}
