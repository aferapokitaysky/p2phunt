import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { AuthenticatedUser, CurrentUser } from "../../common/decorators/current-user.decorator.js";
import { CurrentWorkspace } from "../../common/decorators/current-workspace.decorator.js";
import { AccountsService } from "./accounts.service.js";
import { ConnectAccountSecretDto, CreateAccountDto, UpdateAccountDto } from "./dto.js";

@Controller("accounts")
export class AccountsController {
  constructor(private readonly accounts: AccountsService) {}

  @Get()
  listAccounts(@CurrentWorkspace() workspaceId: string) {
    return this.accounts.listAccounts(workspaceId);
  }

  @Post()
  createAccount(
    @CurrentWorkspace() workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateAccountDto
  ) {
    return this.accounts.createAccount(workspaceId, user.userId, body);
  }

  @Get(":id")
  getAccount(@CurrentWorkspace() workspaceId: string, @Param("id") id: string) {
    return this.accounts.getAccount(workspaceId, id);
  }

  @Patch(":id")
  updateAccount(
    @CurrentWorkspace() workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() body: UpdateAccountDto
  ) {
    return this.accounts.updateAccount(workspaceId, user.userId, id, body);
  }

  @Post(":id/disable")
  disableAccount(
    @CurrentWorkspace() workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string
  ) {
    return this.accounts.disableAccount(workspaceId, user.userId, id);
  }

  @Post(":id/secrets")
  setSecret(
    @CurrentWorkspace() workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() body: ConnectAccountSecretDto
  ) {
    return this.accounts.setSecret(workspaceId, user.userId, id, body);
  }

  @Get(":id/sync-jobs")
  listSyncJobs(@CurrentWorkspace() workspaceId: string, @Param("id") id: string) {
    return this.accounts.listSyncJobs(workspaceId, id);
  }

  @Post(":id/sync")
  syncAccount(@CurrentWorkspace() workspaceId: string, @Param("id") id: string) {
    return this.accounts.requestSync(workspaceId, id);
  }
}
