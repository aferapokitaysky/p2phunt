import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "../../modules/prisma/prisma.service.js";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator.js";

@Injectable()
export class WorkspaceGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as { userId: string } | undefined;
    if (!user) return true;

    const requestedWorkspaceId = (request.headers["x-workspace-id"] as string | undefined) ?? undefined;

    const membership = requestedWorkspaceId
      ? await this.prisma.workspaceMember.findUnique({
          where: { workspaceId_userId: { workspaceId: requestedWorkspaceId, userId: user.userId } }
        })
      : await this.prisma.workspaceMember.findFirst({
          where: { userId: user.userId },
          orderBy: { createdAt: "asc" }
        });

    if (!membership) {
      throw new ForbiddenException("No access to this workspace");
    }

    request.workspaceId = membership.workspaceId;
    request.workspaceRole = membership.role;
    return true;
  }
}
