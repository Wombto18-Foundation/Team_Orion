import { Controller, Get, Post, Put, Delete, Body, Res, Query, UseGuards, Req, Param } from '@nestjs/common';
import { AdminService } from '../services/admin.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AnyAdminGuard } from '../../common/guards/admin.guard';
import { SuperAdminGuard } from '../../common/guards/admin.guard';
import * as path from 'path';
import * as fs from 'fs';
import type { Response, Request } from 'express';

@ApiTags('Admin Panel')
@Controller('admin')
@UseGuards(AnyAdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('panel')
  @ApiOperation({ summary: 'Admin panel (demo HTML)' })
  getAdminPanel(@Res() res: Response) {
    const htmlPath = path.join(__dirname, '..', 'views', 'admin.html');
    const html = fs.readFileSync(htmlPath, 'utf8');
    res.type('text/html').send(html);
  }

  @Get('donors')
  @ApiOperation({ summary: 'List all donors (state-scoped for STATE_ADMIN)' })
  async getDonors(@Req() req: Request) {
    const state = (req as unknown as Record<string, unknown>).adminState as string | null;
    return this.adminService.findAllDonors(state);
  }

  @Get('volunteers')
  @ApiOperation({ summary: 'List all volunteers (state-scoped for STATE_ADMIN)' })
  async getVolunteers(
    @Req() req: Request,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    const state = (req as unknown as Record<string, unknown>).adminState as string | null;
    return this.adminService.findAllVolunteers({ state, status, search });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get administrative metrics (state-scoped for STATE_ADMIN)' })
  async getStats(@Query('range') range: string, @Req() req: Request) {
    const state = (req as unknown as Record<string, unknown>).adminState as string | null;
    return this.adminService.getStats(range, state);
  }

  @Get('programs')
  @ApiOperation({ summary: 'List all programs' })
  async getPrograms() {
    return this.adminService.findAllPrograms();
  }

  @Post('programs')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Create a new donation program (super admin only)' })
  async createProgram(@Body() body: any) {
    return this.adminService.createProgram(body);
  }

  @Post('reports')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Post a progress report (super admin only)' })
  async postReport(@Body() _body: any) {
    return { success: true, message: 'Report posted successfully' };
  }

  @Get('donations')
  @ApiOperation({ summary: 'List all donations with filters (state-scoped for STATE_ADMIN)' })
  async getDonations(
    @Req() req: Request,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('programId') programId?: string,
    @Query('donorSearch') donorSearch?: string,
    @Query('status') status?: string,
  ) {
    const state = (req as unknown as Record<string, unknown>).adminState as string | null;
    return this.adminService.findAllDonations({ startDate, endDate, programId, donorSearch, status, state });
  }

  // ─── Volunteer Withdrawal Management (any admin, state-scoped) ────────────

  @Get('withdrawals')
  @ApiOperation({ summary: 'List withdrawal requests (state-scoped for STATE_ADMIN)' })
  async getWithdrawals(
    @Req() req: Request,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const state = (req as unknown as Record<string, unknown>).adminState as string | null;
    return this.adminService.listWithdrawals({ status, startDate, endDate, state });
  }

  @Get('withdrawals/stats')
  @ApiOperation({ summary: 'Withdrawal summary counts (state-scoped for STATE_ADMIN)' })
  async getWithdrawalStats(@Req() req: Request) {
    const state = (req as unknown as Record<string, unknown>).adminState as string | null;
    return this.adminService.getWithdrawalStats(state);
  }

  @Put('withdrawals/:id/approve')
  @ApiOperation({ summary: 'Approve a withdrawal request' })
  async approveWithdrawal(
    @Param('id') id: string,
    @Body('adminNotes') adminNotes: string | undefined,
    @Req() req: Request,
  ) {
    const reviewedBy = ((req as unknown as Record<string, unknown>).adminPayload as Record<string, unknown>)?.sub as string;
    return this.adminService.approveWithdrawal(id, reviewedBy, adminNotes);
  }

  @Put('withdrawals/:id/reject')
  @ApiOperation({ summary: 'Reject a withdrawal request' })
  async rejectWithdrawal(
    @Param('id') id: string,
    @Body('adminNotes') adminNotes: string,
    @Req() req: Request,
  ) {
    const reviewedBy = ((req as unknown as Record<string, unknown>).adminPayload as Record<string, unknown>)?.sub as string;
    return this.adminService.rejectWithdrawal(id, reviewedBy, adminNotes);
  }

  @Put('withdrawals/:id/mark-paid')
  @ApiOperation({ summary: 'Mark an approved withdrawal as paid' })
  async markWithdrawalPaid(
    @Param('id') id: string,
    @Body('transactionRef') transactionRef: string,
    @Body('adminNotes') adminNotes: string | undefined,
    @Req() req: Request,
  ) {
    const reviewedBy = ((req as unknown as Record<string, unknown>).adminPayload as Record<string, unknown>)?.sub as string;
    return this.adminService.markWithdrawalPaid(id, reviewedBy, transactionRef, adminNotes);
  }

  // ─── Sub-Admin Management (Super Admin only) ───────────────────────────────

  @Post('sub-admins')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Create a new State Admin account' })
  async createSubAdmin(@Req() req: Request, @Body() body: {
    name: string;
    email: string;
    phone?: string;
    state: string;
    password?: string;
  }) {
    const createdBy = ((req as unknown as Record<string, unknown>).adminPayload as Record<string, unknown>)?.sub as string;
    return this.adminService.createSubAdmin({ ...body, createdById: createdBy });
  }

  @Get('sub-admins')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'List all State Admin accounts' })
  async listSubAdmins() {
    return this.adminService.listSubAdmins();
  }

  @Put('sub-admins/:id')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Edit a State Admin (name, phone, state)' })
  async updateSubAdmin(
    @Param('id') id: string,
    @Body() body: { name?: string; phone?: string; state?: string },
  ) {
    return this.adminService.updateSubAdmin(id, body);
  }

  @Put('sub-admins/:id/toggle')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Activate or deactivate a State Admin (instant revocation)' })
  async toggleSubAdmin(@Param('id') id: string) {
    return this.adminService.toggleSubAdmin(id);
  }

  @Delete('sub-admins/:id')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Permanently delete a State Admin (requires { confirm: "DELETE" })' })
  async deleteSubAdmin(@Param('id') id: string, @Body('confirm') confirm: string) {
    return this.adminService.deleteSubAdmin(id, confirm);
  }

  @Post('sub-admins/:id/reset-password')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Generate and email a new password to a State Admin' })
  async resetSubAdminPassword(@Param('id') id: string) {
    return this.adminService.resetSubAdminPassword(id);
  }
}
