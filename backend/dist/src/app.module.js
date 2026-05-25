"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const donor_module_1 = require("./donor/donor.module");
const donation_module_1 = require("./donation/donation.module");
const certificate_module_1 = require("./certificate/certificate.module");
const program_module_1 = require("./program/program.module");
const blog_module_1 = require("./blog/blog.module");
const admin_module_1 = require("./admin/admin.module");
const demo_module_1 = require("./demo/demo.module");
const bhashini_module_1 = require("./bhashini/bhashini.module");
const verification_module_1 = require("./verification/verification.module");
const advisory_module_1 = require("./advisory/advisory.module");
const volunteer_module_1 = require("./volunteer/volunteer.module");
const partner_module_1 = require("./partner/partner.module");
const coin_module_1 = require("./coin/coin.module");
const referral_module_1 = require("./referral/referral.module");
const leaderboard_module_1 = require("./leaderboard/leaderboard.module");
const camp_module_1 = require("./camp/camp.module");
const camp_request_module_1 = require("./camp-request/camp-request.module");
const organizer_module_1 = require("./organizer/organizer.module");
const redis_module_1 = require("./redis/redis.module");
const storage_module_1 = require("./storage/storage.module");
const whatsapp_module_1 = require("./whatsapp/whatsapp.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            prisma_module_1.PrismaModule,
            whatsapp_module_1.WhatsappModule,
            auth_module_1.AuthModule,
            donor_module_1.DonorModule,
            donation_module_1.DonationModule,
            certificate_module_1.CertificateModule,
            program_module_1.ProgramModule,
            blog_module_1.BlogModule,
            admin_module_1.AdminModule,
            demo_module_1.DemoModule,
            bhashini_module_1.BhashiniModule,
            verification_module_1.VerificationModule,
            advisory_module_1.AdvisoryModule,
            volunteer_module_1.VolunteerModule,
            partner_module_1.PartnerMgmtModule,
            coin_module_1.CoinModule,
            referral_module_1.ReferralModule,
            leaderboard_module_1.LeaderboardModule,
            camp_module_1.CampModule,
            camp_request_module_1.CampRequestModule,
            organizer_module_1.OrganizerModule,
            redis_module_1.RedisModule,
            storage_module_1.StorageModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map