import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer
} from "@nestjs/websockets";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import type { Server, Socket } from "socket.io";
import { PrismaService } from "../prisma/prisma.service.js";

@WebSocketGateway({
  cors: {
    origin: process.env.WEB_ORIGIN ?? "http://localhost:5173",
    credentials: true
  }
})
export class WorkspaceGateway {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService
  ) {}

  @SubscribeMessage("workspace.join")
  async joinWorkspace(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { workspaceId: string; accessToken: string }
  ) {
    try {
      const payload = this.jwtService.verify<{ sub: string }>(body.accessToken, {
        secret: this.config.get<string>("JWT_ACCESS_SECRET", "change-me-access")
      });

      const membership = await this.prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId: body.workspaceId, userId: payload.sub } }
      });

      if (!membership) {
        return { ok: false, error: "No access to this workspace" };
      }

      await socket.join(`workspace:${body.workspaceId}`);
      return { ok: true, workspaceId: body.workspaceId };
    } catch {
      return { ok: false, error: "Invalid access token" };
    }
  }

  emitToWorkspace(workspaceId: string, event: string, payload: unknown) {
    this.server.to(`workspace:${workspaceId}`).emit(event, payload);
  }
}
