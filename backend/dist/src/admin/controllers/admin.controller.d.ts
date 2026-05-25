import { AdminService } from '../services/admin.service';
import type { Response, Request } from 'express';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    getAdminPanel(res: Response): void;
    getDonors(req: Request): Promise<any>;
    getVolunteers(req: Request, status?: string, search?: string): Promise<{
        success: boolean;
        volunteers: any;
    }>;
    getStats(range: string, req: Request): Promise<{
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
    getPrograms(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string;
        targetAmount: number;
        raisedAmount: number;
    }[]>;
    createProgram(body: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string;
        targetAmount: number;
        raisedAmount: number;
    }>;
    postReport(_body: any): Promise<{
        success: boolean;
        message: string;
    }>;
    getDonations(req: Request, startDate?: string, endDate?: string, programId?: string, donorSearch?: string, status?: string): Promise<any>;
    getWithdrawals(req: Request, status?: string, startDate?: string, endDate?: string): Promise<{
        success: boolean;
        withdrawals: any;
    }>;
    getWithdrawalStats(req: Request): Promise<{
        success: boolean;
        stats: {
            pending: any;
            approved: any;
            paid: any;
            rejected: any;
            pendingAmountInr: number;
        };
    }>;
    approveWithdrawal(id: string, adminNotes: string | undefined, req: Request): Promise<{
        success: boolean;
        message: string;
    }>;
    rejectWithdrawal(id: string, adminNotes: string, req: Request): Promise<{
        success: boolean;
        message: string;
    }>;
    markWithdrawalPaid(id: string, transactionRef: string, adminNotes: string | undefined, req: Request): Promise<{
        success: boolean;
        message: string;
    }>;
    createSubAdmin(req: Request, body: {
        name: string;
        email: string;
        phone?: string;
        state: string;
        password?: string;
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
    updateSubAdmin(id: string, body: {
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
}
