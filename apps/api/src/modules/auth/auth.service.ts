import { randomBytes, createHash } from "node:crypto";
import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { AuditService } from "../audit/audit.service.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { LoginDto, RegisterDto } from "./dto.js";

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL_DAYS = 30;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly audit: AuditService
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException("Этот email уже зарегистрирован");
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          displayName: dto.displayName ?? dto.email.split("@")[0] ?? null
        }
      });

      const workspace = await tx.workspace.create({
        data: { name: dto.workspaceName ?? `${createdUser.displayName ?? createdUser.email}'s workspace` }
      });

      await tx.workspaceMember.create({
        data: { workspaceId: workspace.id, userId: createdUser.id, role: "owner" }
      });

      return createdUser;
    });

    await this.audit.record({
      workspaceId: (await this.prisma.workspaceMember.findFirstOrThrow({ where: { userId: user.id } }))
        .workspaceId,
      actorUserId: user.id,
      actorType: "user",
      action: "user.registered",
      entityType: "User",
      entityId: user.id
    });

    return this.issueTokens(user.id, user.email);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      throw new UnauthorizedException("Неверный email или пароль");
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException("Неверный email или пароль");
    }

    const membership = await this.prisma.workspaceMember.findFirst({ where: { userId: user.id } });
    if (membership) {
      await this.audit.record({
        workspaceId: membership.workspaceId,
        actorUserId: user.id,
        actorType: "user",
        action: "user.login",
        entityType: "User",
        entityId: user.id
      });
    }

    return this.issueTokens(user.id, user.email);
  }

  async refresh(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException("Недействительный или истёкший refresh-токен");
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() }
    });

    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: stored.userId } });
    return this.issueTokens(user.id, user.email);
  }

  async logout(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() }
    });
    return { ok: true };
  }

  async me(userId: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        status: true,
        createdAt: true,
        memberships: {
          select: {
            role: true,
            workspace: { select: { id: true, name: true, mode: true, emergencyStop: true } }
          }
        }
      }
    });
  }

  private async issueTokens(userId: string, email: string) {
    const accessToken = await this.jwtService.signAsync(
      { sub: userId, email },
      {
        secret: this.config.get<string>("JWT_ACCESS_SECRET", "change-me-access"),
        expiresIn: ACCESS_TOKEN_TTL
      }
    );

    const refreshToken = randomBytes(48).toString("base64url");
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: this.hashToken(refreshToken),
        expiresAt
      }
    });

    return { accessToken, refreshToken, expiresIn: 15 * 60 };
  }

  private hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }
}
