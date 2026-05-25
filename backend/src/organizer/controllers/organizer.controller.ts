import { Controller, Post, Get, Put, Body, Param, Res, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { OrganizerService } from '../services/organizer.service';
import { CampOrganizerGuard } from '../../common/guards/camp-organizer.guard';
import type { Response, Request } from 'express';

@ApiTags('Camp Organizer')
@Controller('organizer')
export class OrganizerController {
  constructor(private readonly organizerService: OrganizerService) {}

  // ─── Auth (no guard) ────────────────────────────────────────────────────────

  @Post('login')
  @ApiOperation({ summary: 'Camp organizer login' })
  async login(
    @Body('email') email: string,
    @Body('password') password: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!email || !password) return { error: 'Email and password are required.' };

    const result = await this.organizerService.login(email, password);

    if (result.token) {
      res.cookie('organizer_token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000,
      });
    }

    return result;
  }

  @Post('logout')
  @ApiOperation({ summary: 'Camp organizer logout — clears session cookie' })
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('organizer_token');
    return { success: true, message: 'Logged out.' };
  }

  // ─── First-time password setup (requires valid organizer JWT) ───────────────

  @Post('set-password')
  @UseGuards(CampOrganizerGuard)
  @ApiOperation({ summary: 'Set password and coin pool on first login' })
  async setPassword(
    @Body('newPassword') newPassword: string,
    @Body('confirmPassword') confirmPassword: string,
    @Body('totalCoinPool') totalCoinPool: number,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!newPassword || !confirmPassword) return { error: 'Both password fields are required.' };

    const organizerId = ((req as unknown as Record<string, unknown>).organizerPayload as Record<string, unknown>)?.sub as string;
    const result = await this.organizerService.setPassword(organizerId, newPassword, confirmPassword, Number(totalCoinPool));

    if (result.token) {
      res.cookie('organizer_token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000,
      });
    }

    return result;
  }

  @Put('camp/coin-pool')
  @UseGuards(CampOrganizerGuard)
  @ApiOperation({ summary: 'Update the coin prize pool for this camp' })
  async updateCoinPool(
    @Body('totalCoinPool') totalCoinPool: number,
    @Req() req: Request,
  ) {
    const campId = (req as unknown as Record<string, unknown>).organizerCampId as string;
    return this.organizerService.updateCoinPool(campId, Number(totalCoinPool));
  }

  // ─── Protected routes (CampOrganizerGuard) ─────────────────────────────────

  @Get('camp')
  @UseGuards(CampOrganizerGuard)
  @ApiOperation({ summary: 'Get camp dashboard data for this organizer' })
  async getCamp(@Req() req: Request) {
    const payload = (req as unknown as Record<string, unknown>).organizerPayload as Record<string, unknown>;
    return this.organizerService.getCampDashboard(payload.sub as string, payload.campId as string);
  }

  @Get('camp/participants')
  @UseGuards(CampOrganizerGuard)
  @ApiOperation({ summary: 'List registered volunteers for this camp' })
  async getParticipants(@Req() req: Request) {
    const campId = (req as unknown as Record<string, unknown>).organizerCampId as string;
    return this.organizerService.getParticipants(campId);
  }

  @Put('camp/registrations/:volunteerId/status')
  @UseGuards(CampOrganizerGuard)
  @ApiOperation({ summary: 'Approve or reject a volunteer registration' })
  async updateRegistration(
    @Param('volunteerId') volunteerId: string,
    @Body('status') status: 'APPROVED' | 'REJECTED',
    @Req() req: Request,
  ) {
    const campId = (req as unknown as Record<string, unknown>).organizerCampId as string;
    return this.organizerService.updateRegistrationStatus(campId, volunteerId, status);
  }

  @Put('camp/volunteers/:volunteerId/select')
  @UseGuards(CampOrganizerGuard)
  @ApiOperation({ summary: 'Select or deselect a volunteer for the attendance window' })
  async updateSelection(
    @Param('volunteerId') volunteerId: string,
    @Body('selected') selected: boolean,
    @Req() req: Request,
  ) {
    const campId = (req as unknown as Record<string, unknown>).organizerCampId as string;
    return this.organizerService.updateShareSelection(campId, volunteerId, selected);
  }

  // ─── Attendance window ─────────────────────────────────────────────────────

  @Get('camp/attendance')
  @UseGuards(CampOrganizerGuard)
  @ApiOperation({ summary: 'Get current attendance window status and scan log' })
  async getAttendance(@Req() req: Request) {
    const campId = (req as unknown as Record<string, unknown>).organizerCampId as string;
    return this.organizerService.getAttendanceStatus(campId);
  }

  @Post('camp/activate-attendance')
  @UseGuards(CampOrganizerGuard)
  @ApiOperation({ summary: 'Open a 10-minute QR attendance window' })
  async activateAttendance(@Req() req: Request) {
    const campId = (req as unknown as Record<string, unknown>).organizerCampId as string;
    return this.organizerService.activateAttendance(campId);
  }

  @Post('camp/close-attendance')
  @UseGuards(CampOrganizerGuard)
  @ApiOperation({ summary: 'Close the attendance window early' })
  async closeAttendance(@Req() req: Request) {
    const campId = (req as unknown as Record<string, unknown>).organizerCampId as string;
    return this.organizerService.closeAttendance(campId);
  }

  @Post('camp/scan')
  @UseGuards(CampOrganizerGuard)
  @ApiOperation({ summary: 'Process a volunteer QR scan to mark attendance' })
  async processScan(
    @Body('token') token: string,
    @Body('volunteerId') volunteerId: string,
    @Req() req: Request,
  ) {
    const campId = (req as unknown as Record<string, unknown>).organizerCampId as string;
    return this.organizerService.processAttendanceScan(campId, token, volunteerId);
  }
}
