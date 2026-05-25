import { Controller, Post, Get, Put, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CampRequestService } from '../services/camp-request.service';
import { AnyAdminGuard } from '../../common/guards/admin.guard';
import type { Request } from 'express';

@ApiTags('Camp Requests')
@Controller()
export class CampRequestController {
  constructor(private readonly campRequestService: CampRequestService) {}

  /** Public — no auth required */
  @Post('camp-requests')
  @ApiOperation({ summary: 'Submit a camp hosting request (public)' })
  async submit(@Body() body: {
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
    return this.campRequestService.submitRequest(body);
  }

  // ─── Admin routes ──────────────────────────────────────────────────────────

  @Get('admin/camp-requests')
  @UseGuards(AnyAdminGuard)
  @ApiOperation({ summary: 'List camp requests (state-scoped for STATE_ADMIN)' })
  async list(
    @Req() req: Request,
    @Query('status') status?: string,
    @Query('campType') campType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const state = (req as unknown as Record<string, unknown>).adminState as string | null;
    return this.campRequestService.listRequests({ status, state, campType, startDate, endDate });
  }

  @Get('admin/camp-requests/:id')
  @UseGuards(AnyAdminGuard)
  @ApiOperation({ summary: 'Get full details of one camp request' })
  async getOne(@Param('id') id: string) {
    return this.campRequestService.getRequestById(id);
  }

  @Put('admin/camp-requests/:id/approve')
  @UseGuards(AnyAdminGuard)
  @ApiOperation({ summary: 'Approve a camp request — creates Camp + Organizer account + emails credentials' })
  async approve(@Param('id') id: string, @Req() req: Request) {
    const reviewedBy = ((req as unknown as Record<string, unknown>).adminPayload as Record<string, unknown>)?.sub as string;
    return this.campRequestService.approveRequest(id, reviewedBy);
  }

  @Put('admin/camp-requests/:id/reject')
  @UseGuards(AnyAdminGuard)
  @ApiOperation({ summary: 'Reject a camp request with a reason' })
  async reject(
    @Param('id') id: string,
    @Body('adminNotes') adminNotes: string,
    @Req() req: Request,
  ) {
    const reviewedBy = ((req as unknown as Record<string, unknown>).adminPayload as Record<string, unknown>)?.sub as string;
    return this.campRequestService.rejectRequest(id, reviewedBy, adminNotes);
  }
}
