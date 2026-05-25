import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CampService } from '../services/camp.service';

@ApiTags('Camps')
@Controller('camps')
export class CampController {
  constructor(private readonly campService: CampService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create a new camp (admin)' })
  async create(@Body() body: {
    name: string;
    description: string;
    location: string;
    date: string;
    endDate?: string;
    assignedAdminId?: string;
    totalCoinPool?: number;
    purpose?: string;
  }) {
    return this.campService.createCamp(body);
  }

  @Get('admin/:campId')
  @ApiOperation({ summary: 'Get camp with QR codes (admin)' })
  async getCampAdmin(@Param('campId') campId: string) {
    return this.campService.getCampAdmin(campId);
  }

  @Post('rotate-qr')
  @ApiOperation({ summary: 'Get Current QR Token State' })
  async rotateQr(@Body() body: { campId: string }) {
    return this.campService.getQrTokens(body.campId);
  }

  @Get('qr-tokens/:campId')
  @ApiOperation({ summary: 'Get Current QR Tokens' })
  async getQrTokens(@Param('campId') campId: string) {
    return this.campService.getQrTokens(campId);
  }

  @Post('scan')
  @ApiOperation({ summary: 'Unified volunteer scanning (Normal/Active QR)' })
  async scanQr(
    @Body('token') token: string,
    @Body('volunteerId') volunteerId: string,
  ) {
    return this.campService.scanQr(token, volunteerId);
  }

  @Post(':campId/selection')
  @ApiOperation({ summary: 'Mark whether a volunteer is selected for attendance sharing' })
  async updateShareSelection(
    @Param('campId') campId: string,
    @Body('volunteerId') volunteerId: string,
    @Body('shareSelected') shareSelected: boolean,
  ) {
    return this.campService.updateShareSelection(campId, volunteerId, shareSelected);
  }

  @Post(':campId/activate-attendance')
  @ApiOperation({ summary: 'Activate the 100 coin attendance QR and notify volunteers' })
  async activateAttendance(@Param('campId') campId: string) {
    return this.campService.activateAttendance(campId);
  }

  @Post(':campId/close-channels')
  @ApiOperation({ summary: 'Admin manually terminates digital attendance channels' })
  async closeDigitalChannels(@Param('campId') campId: string) {
    return this.campService.closeDigitalChannels(campId);
  }

  @Post(':campId/scan-digital')
  @ApiOperation({ summary: 'Volunteer processes attendance via shared Push button' })
  async scanDigital(
    @Param('campId') campId: string,
    @Body('volunteerId') volunteerId: string,
  ) {
    return this.campService.scanDigital(campId, volunteerId);
  }

  @Post(':campId/register')
  @ApiOperation({ summary: 'Volunteer registers for a camp' })
  async registerCamp(
    @Param('campId') campId: string,
    @Body('volunteerId') volunteerId: string,
  ) {
    return this.campService.registerCamp(campId, volunteerId);
  }

  @Post(':campId/response')
  @ApiOperation({ summary: 'Volunteer confirms whether they are joining the camp' })
  async updateVolunteerResponse(
    @Param('campId') campId: string,
    @Body('volunteerId') volunteerId: string,
    @Body('response') response: 'JOINING' | 'NOT_JOINING',
  ) {
    return this.campService.updateVolunteerResponse(campId, volunteerId, response);
  }

  @Post(':campId/registrations/:volunteerId/status')
  @ApiOperation({ summary: 'Admin approves or rejects a registration' })
  async updateRegistrationStatus(
    @Param('campId') campId: string,
    @Param('volunteerId') volunteerId: string,
    @Body('status') status: 'APPROVED' | 'REJECTED',
  ) {
    return this.campService.updateRegistrationStatus(campId, volunteerId, status);
  }

  @Get('list')
  @ApiOperation({ summary: 'List all camps with participant counts' })
  async list(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('state') state?: string,
  ) {
    const pageNum = page ? Number(page) : undefined;
    const limitNum = limit ? Number(limit) : undefined;
    return this.campService.listCamps(status, pageNum, limitNum, state);
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming camps for volunteers' })
  async upcoming() {
    return this.campService.getUpcomingCamps();
  }

  @Get(':campId/detail')
  @ApiOperation({ summary: 'Get full camp detail with participants' })
  async getCampDetail(@Param('campId') campId: string) {
    return this.campService.getCampDetail(campId);
  }

  @Post('status')
  @ApiOperation({ summary: 'Update camp status (admin)' })
  async updateStatus(
    @Body('campId') campId: string,
    @Body('status') status: string,
  ) {
    return this.campService.updateStatus(campId, status);
  }
}
