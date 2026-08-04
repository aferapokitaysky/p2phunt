import { Controller, Get, Param, Query } from "@nestjs/common";
import { CurrentWorkspace } from "../../common/decorators/current-workspace.decorator.js";
import { CommandsService } from "./commands.service.js";

@Controller("commands")
export class CommandsController {
  constructor(private readonly commands: CommandsService) {}

  @Get()
  list(@CurrentWorkspace() workspaceId: string, @Query("accountId") accountId?: string) {
    return this.commands.listCommands(workspaceId, accountId);
  }

  @Get(":id")
  get(@CurrentWorkspace() workspaceId: string, @Param("id") id: string) {
    return this.commands.getCommand(workspaceId, id);
  }
}
