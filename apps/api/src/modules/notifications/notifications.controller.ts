import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { CurrentWorkspace } from "../../common/decorators/current-workspace.decorator.js";
import { CreateChannelDto, UpdateChannelDto } from "./dto.js";
import { NotificationsService } from "./notifications.service.js";

@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@CurrentWorkspace() workspaceId: string, @Query("status") status?: string) {
    return this.notifications.list(workspaceId, status);
  }

  @Post(":id/read")
  markRead(@CurrentWorkspace() workspaceId: string, @Param("id") id: string) {
    return this.notifications.markRead(workspaceId, id);
  }

  @Post("read-all")
  markAllRead(@CurrentWorkspace() workspaceId: string) {
    return this.notifications.markAllRead(workspaceId);
  }

  @Get("channels")
  listChannels(@CurrentWorkspace() workspaceId: string) {
    return this.notifications.listChannels(workspaceId);
  }

  @Post("channels")
  createChannel(@CurrentWorkspace() workspaceId: string, @Body() body: CreateChannelDto) {
    return this.notifications.createChannel(workspaceId, body);
  }

  @Patch("channels/:id")
  updateChannel(@CurrentWorkspace() workspaceId: string, @Param("id") id: string, @Body() body: UpdateChannelDto) {
    return this.notifications.updateChannel(workspaceId, id, body);
  }

  @Delete("channels/:id")
  removeChannel(@CurrentWorkspace() workspaceId: string, @Param("id") id: string) {
    return this.notifications.removeChannel(workspaceId, id);
  }
}
