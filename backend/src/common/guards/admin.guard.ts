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
  const cookie = (req.cookies as Record<string, string>)?.auth_token;
  if (cookie) return cookie;
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) return auth.slice(7);
  return null;
}

function setReqProp(req: Request, key: string, value: unknown): void {
  (req as unknown as Record<string, unknown>)[key] = value;
}

/** Allows SUPER_ADMIN and STATE_ADMIN. Does a DB isActive check for STATE_ADMIN. */
@Injectable()
export class AdminGuard implements CanActivate {
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

    const role = payload.role as string;
    if (role !== 'SUPER_ADMIN' && role !== 'STATE_ADMIN') {
      throw new ForbiddenException('Admin access required');
    }

    if (role === 'STATE_ADMIN') {
      const admin = await (this.prisma as any).admin.findUnique({
        where: { id: payload.sub as string },
        select: { isActive: true, state: true },
      });
      if (!admin || !admin.isActive) {
        throw new ForbiddenException('Admin account is deactivated');
      }
      setReqProp(req, 'adminState', admin.state);
    }

    setReqProp(req, 'adminPayload', payload);
    return true;
  }
}

/** Allows SUPER_ADMIN only. */
@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<Request>();
    const token = extractToken(req);
    if (!token) throw new UnauthorizedException('No auth token');

    let payload: Record<string, unknown>;
    try {
      payload = this.jwt.verify(token) as Record<string, unknown>;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (payload.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Super admin access required');
    }

    setReqProp(req, 'adminPayload', payload);
    return true;
  }
}

/**
 * Allows both SUPER_ADMIN and STATE_ADMIN.
 * Attaches adminState to request:
 *   - STATE_ADMIN: DB-verified state (instant revocation)
 *   - SUPER_ADMIN: `stateFilter` query param if provided, else null (all states)
 */
@Injectable()
export class AnyAdminGuard implements CanActivate {
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

    const role = payload.role as string;
    if (role !== 'SUPER_ADMIN' && role !== 'STATE_ADMIN') {
      throw new ForbiddenException('Admin access required');
    }

    if (role === 'STATE_ADMIN') {
      const admin = await (this.prisma as any).admin.findUnique({
        where: { id: payload.sub as string },
        select: { isActive: true, state: true },
      });
      if (!admin || !admin.isActive) {
        throw new ForbiddenException('Admin account is deactivated');
      }
      setReqProp(req, 'adminState', admin.state);
    } else {
      const query = req.query as Record<string, string>;
      setReqProp(req, 'adminState', query.state || query.stateFilter || null);
    }

    setReqProp(req, 'adminPayload', payload);
    setReqProp(req, 'adminRole', role);
    return true;
  }
}
