import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { DonorModule } from './donor/donor.module';
import { DonationModule } from './donation/donation.module';
import { CertificateModule } from './certificate/certificate.module';
import { ProgramModule } from './program/program.module';
import { BlogModule } from './blog/blog.module';
import { AdminModule } from './admin/admin.module';
import { DemoModule } from './demo/demo.module';
import { BhashiniModule } from './bhashini/bhashini.module';
import { VerificationModule } from './verification/verification.module';
import { AdvisoryModule } from './advisory/advisory.module';
import { VolunteerModule } from './volunteer/volunteer.module';
import { PartnerMgmtModule } from './partner/partner.module';
import { CoinModule } from './coin/coin.module';
import { ReferralModule } from './referral/referral.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { CampModule } from './camp/camp.module';
import { CampRequestModule } from './camp-request/camp-request.module';
import { OrganizerModule } from './organizer/organizer.module';
import { RedisModule } from './redis/redis.module';
import { StorageModule } from './storage/storage.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    WhatsappModule,
    AuthModule,
    DonorModule,
    DonationModule,
    CertificateModule,
    ProgramModule,
    BlogModule,
    AdminModule,
    DemoModule,
    BhashiniModule,
    VerificationModule,
    AdvisoryModule,
    VolunteerModule,
    PartnerMgmtModule,
    CoinModule,
    ReferralModule,
    LeaderboardModule,
    CampModule,
    CampRequestModule,
    OrganizerModule,
    RedisModule,
    StorageModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
