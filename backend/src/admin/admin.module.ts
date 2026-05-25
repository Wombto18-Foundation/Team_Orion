import { Module } from '@nestjs/common';
import { AdminController } from './controllers/admin.controller';
import { AdminService } from './services/admin.service';
import { GuardsModule } from '../common/guards/guards.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [GuardsModule, AuthModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
