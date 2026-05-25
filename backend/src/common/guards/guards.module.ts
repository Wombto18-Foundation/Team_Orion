import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AdminGuard, SuperAdminGuard, AnyAdminGuard } from './admin.guard';
import { CampOrganizerGuard } from './camp-organizer.guard';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') || 'secretKey',
        signOptions: { expiresIn: '1d' },
      }),
    }),
  ],
  providers: [AdminGuard, SuperAdminGuard, AnyAdminGuard, CampOrganizerGuard],
  exports: [AdminGuard, SuperAdminGuard, AnyAdminGuard, CampOrganizerGuard],
})
export class GuardsModule {}
