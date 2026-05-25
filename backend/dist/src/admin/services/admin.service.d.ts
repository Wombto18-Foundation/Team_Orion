import { PrismaService } from '../../prisma/services/prisma.service';
import { MailerService } from '../../auth/services/mailer.service';
import { ConfigService } from '@nestjs/config';
export declare class AdminService {
    private readonly prisma;
    private readonly mailer;
    private readonly config;
    constructor(prisma: PrismaService, mailer: MailerService, config: ConfigService);
    private generatePassword;
    createSubAdmin(data: {
        name: string;
        email: string;
        phone?: string;
        state: string;
        password?: string;
        createdById?: string;
    }): Promise<{
        success: boolean;
        admin: {
            id: any;
            name: any;
            email: any;
            state: any;
            role: any;
            isActive: any;
            createdAt: any;
        };
    }>;
    listSubAdmins(): Promise<{
        success: boolean;
        admins: any;
    }>;
    updateSubAdmin(id: string, data: {
        name?: string;
        phone?: string;
        state?: string;
    }): Promise<{
        success: boolean;
        admin: any;
    }>;
    toggleSubAdmin(id: string): Promise<{
        success: boolean;
        admin: any;
        message: string;
    }>;
    deleteSubAdmin(id: string, confirm: string): Promise<{
        success: boolean;
        message: string;
    }>;
    resetSubAdminPassword(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    listWithdrawals(filters: {
        status?: string;
        startDate?: string;
        endDate?: string;
        state?: string | null;
    }): Promise<{
        success: boolean;
        withdrawals: any;
    }>;
    getWithdrawalStats(state?: string | null): Promise<{
        success: boolean;
        stats: {
            pending: any;
            approved: any;
            paid: any;
            rejected: any;
            pendingAmountInr: number;
        };
    }>;
    approveWithdrawal(id: string, reviewedBy: string, adminNotes?: string): Promise<{
        success: boolean;
        message: string;
    }>;
    rejectWithdrawal(id: string, reviewedBy: string, adminNotes: string): Promise<{
        success: boolean;
        message: string;
    }>;
    markWithdrawalPaid(id: string, reviewedBy: string, transactionRef: string, adminNotes?: string): Promise<{
        success: boolean;
        message: string;
    }>;
    findAllVolunteers(filters: {
        state?: string | null;
        status?: string;
        search?: string;
    }): Promise<{
        success: boolean;
        volunteers: any;
    }>;
    findAllDonors(state?: string | null): Promise<any>;
    private timeAgo;
    findAllPrograms(): Promise<{
        id: string;
        name: string;
        description: string;
        targetAmount: number;
        raisedAmount: number;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    createProgram(data: any): Promise<{
        id: string;
        name: string;
        description: string;
        targetAmount: number;
        raisedAmount: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getStats(range?: string, state?: string | null): Promise<{
        totalDonations: any;
        totalDonors: any;
        totalPrograms: number;
        recentDonations: any;
        chartData: any[];
        mappingStats: {
            oneTime: number;
            recurring: number;
        };
    }>;
    private getStartDate;
    private aggregateChartData;
    private getMappingStats;
    findAllDonations(filters: {
        startDate?: string;
        endDate?: string;
        programId?: string;
        donorSearch?: string;
        status?: string;
        state?: string | null;
    }): Promise<any>;
}
