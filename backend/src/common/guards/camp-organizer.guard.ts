import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/services/prisma.service';
import { Request } from 'express';

function extractToken(req: Request): string | null {
  const cookies = req.cookies as Record<string, string>;
  // Accept either the organizer-specific cookie or the shared auth_token
  const cookie = cookies?.organizer_token || cookies?.auth_token;
  if (cookie) return cookie;
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) return auth.slice(7);
  return null;
}

function setReqProp(req: Request, key: string, value: unknown): void {
  (req as unknown as Record<string, unknown>)[key] = value;
}

/** Allows CAMP_ORGANIZER role. DB-checks isActive and accessExpiresAt on every request. */
@Injectable()
export class CampOrganizerGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<Request>();
    const token = extractToken(req);
    if (!token) throw new UnauthorizedException('No auth token');

    let payload: Record<string, unknown>;
    try {
      payload = this.jwt.verify(token) as Record<string, unknown>;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (payload.role !== 'CAMP_ORGANIZER') {
      throw new ForbiddenException('Camp organizer access required');
    }

    const organizer = await (this.prisma as any).campOrganizer.findUnique({
      where: { id: payload.sub as string },
      select: { isActive: true, accessExpiresAt: true, campId: true },
    });

    if (!organizer || !organizer.isActive) {
      throw new ForbiddenException('Camp organizer account is deactivated');
    }

    if (organizer.accessExpiresAt && new Date() > new Date(organizer.accessExpiresAt as Date)) {
      throw new ForbiddenException('Camp organizer access has expired');
    }

    setReqProp(req, 'organizerPayload', payload);
    setReqProp(req, 'organizerCampId', organizer.campId);
    return true;
  }
}
