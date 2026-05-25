"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const admin_service_1 = require("../services/admin.service");
const swagger_1 = require("@nestjs/swagger");
const admin_guard_1 = require("../../common/guards/admin.guard");
const admin_guard_2 = require("../../common/guards/admin.guard");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
let AdminController = class AdminController {
    adminService;
    constructor(adminService) {
        this.adminService = adminService;
    }
    getAdminPanel(res) {
        const htmlPath = path.join(__dirname, '..', 'views', 'admin.html');
        const html = fs.readFileSync(htmlPath, 'utf8');
        res.type('text/html').send(html);
    }
    async getDonors(req) {
        const state = req.adminState;
        return this.adminService.findAllDonors(state);
    }
    async getVolunteers(req, status, search) {
        const state = req.adminState;
        return this.adminService.findAllVolunteers({ state, status, search });
    }
    async getStats(range, req) {
        const state = req.adminState;
        return this.adminService.getStats(range, state);
    }
    async getPrograms() {
        return this.adminService.findAllPrograms();
    }
    async createProgram(body) {
        return this.adminService.createProgram(body);
    }
    async postReport(_body) {
        return { success: true, message: 'Report posted successfully' };
    }
    async getDonations(req, startDate, endDate, programId, donorSearch, status) {
        const state = req.adminState;
        return this.adminService.findAllDonations({ startDate, endDate, programId, donorSearch, status, state });
    }
    async getWithdrawals(req, status, startDate, endDate) {
        const state = req.adminState;
        return this.adminService.listWithdrawals({ status, startDate, endDate, state });
    }
    async getWithdrawalStats(req) {
        const state = req.adminState;
        return this.adminService.getWithdrawalStats(state);
    }
    async approveWithdrawal(id, adminNotes, req) {
        const reviewedBy = req.adminPayload?.sub;
        return this.adminService.approveWithdrawal(id, reviewedBy, adminNotes);
    }
    async rejectWithdrawal(id, adminNotes, req) {
        const reviewedBy = req.adminPayload?.sub;
        return this.adminService.rejectWithdrawal(id, reviewedBy, adminNotes);
    }
    async markWithdrawalPaid(id, transactionRef, adminNotes, req) {
        const reviewedBy = req.adminPayload?.sub;
        return this.adminService.markWithdrawalPaid(id, reviewedBy, transactionRef, adminNotes);
    }
    async createSubAdmin(req, body) {
        const createdBy = req.adminPayload?.sub;
        return this.adminService.createSubAdmin({ ...body, createdById: createdBy });
    }
    async listSubAdmins() {
        return this.adminService.listSubAdmins();
    }
    async updateSubAdmin(id, body) {
        return this.adminService.updateSubAdmin(id, body);
    }
    async toggleSubAdmin(id) {
        return this.adminService.toggleSubAdmin(id);
    }
    async deleteSubAdmin(id, confirm) {
        return this.adminService.deleteSubAdmin(id, confirm);
    }
    async resetSubAdminPassword(id) {
        return this.adminService.resetSubAdminPassword(id);
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('panel'),
    (0, swagger_1.ApiOperation)({ summary: 'Admin panel (demo HTML)' }),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getAdminPanel", null);
__decorate([
    (0, common_1.Get)('donors'),
    (0, swagger_1.ApiOperation)({ summary: 'List all donors (state-scoped for STATE_ADMIN)' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getDonors", null);
__decorate([
    (0, common_1.Get)('volunteers'),
    (0, swagger_1.ApiOperation)({ summary: 'List all volunteers (state-scoped for STATE_ADMIN)' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getVolunteers", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get administrative metrics (state-scoped for STATE_ADMIN)' }),
    __param(0, (0, common_1.Query)('range')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('programs'),
    (0, swagger_1.ApiOperation)({ summary: 'List all programs' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getPrograms", null);
__decorate([
    (0, common_1.Post)('programs'),
    (0, common_1.UseGuards)(admin_guard_2.SuperAdminGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new donation program (super admin only)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createProgram", null);
__decorate([
    (0, common_1.Post)('reports'),
    (0, common_1.UseGuards)(admin_guard_2.SuperAdminGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Post a progress report (super admin only)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "postReport", null);
__decorate([
    (0, common_1.Get)('donations'),
    (0, swagger_1.ApiOperation)({ summary: 'List all donations with filters (state-scoped for STATE_ADMIN)' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __param(3, (0, common_1.Query)('programId')),
    __param(4, (0, common_1.Query)('donorSearch')),
    __param(5, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getDonations", null);
__decorate([
    (0, common_1.Get)('withdrawals'),
    (0, swagger_1.ApiOperation)({ summary: 'List withdrawal requests (state-scoped for STATE_ADMIN)' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('startDate')),
    __param(3, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getWithdrawals", null);
__decorate([
    (0, common_1.Get)('withdrawals/stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Withdrawal summary counts (state-scoped for STATE_ADMIN)' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getWithdrawalStats", null);
__decorate([
    (0, common_1.Put)('withdrawals/:id/approve'),
    (0, swagger_1.ApiOperation)({ summary: 'Approve a withdrawal request' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('adminNotes')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "approveWithdrawal", null);
__decorate([
    (0, common_1.Put)('withdrawals/:id/reject'),
    (0, swagger_1.ApiOperation)({ summary: 'Reject a withdrawal request' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('adminNotes')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "rejectWithdrawal", null);
__decorate([
    (0, common_1.Put)('withdrawals/:id/mark-paid'),
    (0, swagger_1.ApiOperation)({ summary: 'Mark an approved withdrawal as paid' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('transactionRef')),
    __param(2, (0, common_1.Body)('adminNotes')),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "markWithdrawalPaid", null);
__decorate([
    (0, common_1.Post)('sub-admins'),
    (0, common_1.UseGuards)(admin_guard_2.SuperAdminGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new State Admin account' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createSubAdmin", null);
__decorate([
    (0, common_1.Get)('sub-admins'),
    (0, common_1.UseGuards)(admin_guard_2.SuperAdminGuard),
    (0, swagger_1.ApiOperation)({ summary: 'List all State Admin accounts' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "listSubAdmins", null);
__decorate([
    (0, common_1.Put)('sub-admins/:id'),
    (0, common_1.UseGuards)(admin_guard_2.SuperAdminGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Edit a State Admin (name, phone, state)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateSubAdmin", null);
__decorate([
    (0, common_1.Put)('sub-admins/:id/toggle'),
    (0, common_1.UseGuards)(admin_guard_2.SuperAdminGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Activate or deactivate a State Admin (instant revocation)' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "toggleSubAdmin", null);
__decorate([
    (0, common_1.Delete)('sub-admins/:id'),
    (0, common_1.UseGuards)(admin_guard_2.SuperAdminGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Permanently delete a State Admin (requires { confirm: "DELETE" })' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('confirm')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteSubAdmin", null);
__decorate([
    (0, common_1.Post)('sub-admins/:id/reset-password'),
    (0, common_1.UseGuards)(admin_guard_2.SuperAdminGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Generate and email a new password to a State Admin' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "resetSubAdminPassword", null);
exports.AdminController = AdminController = __decorate([
    (0, swagger_1.ApiTags)('Admin Panel'),
    (0, common_1.Controller)('admin'),
    (0, common_1.UseGuards)(admin_guard_1.AnyAdminGuard),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map