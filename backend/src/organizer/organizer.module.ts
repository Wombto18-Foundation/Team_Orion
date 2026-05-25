import { Module } from '@nestjs/common';
import { OrganizerController } from './controllers/organizer.controller';
import { OrganizerService } from './services/organizer.service';
import { AuthModule } from '../auth/auth.module';
import { GuardsModule } from '../common/guards/guards.module';
import { CoinModule } from '../coin/coin.module';
import { CertificateModule } from '../certificate/certificate.module';

@Module({
  imports: [AuthModule, GuardsModule, CoinModule, CertificateModule],
  controllers: [OrganizerController],
  providers: [OrganizerService],
})
export class OrganizerModule {}
