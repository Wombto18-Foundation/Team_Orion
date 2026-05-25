import { Module } from '@nestjs/common';
import { CampRequestController } from './controllers/camp-request.controller';
import { CampRequestService } from './services/camp-request.service';
import { AuthModule } from '../auth/auth.module';
import { GuardsModule } from '../common/guards/guards.module';

@Module({
  imports: [AuthModule, GuardsModule],
  controllers: [CampRequestController],
  providers: [CampRequestService],
  exports: [CampRequestService],
})
export class CampRequestModule {}
