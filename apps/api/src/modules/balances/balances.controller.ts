import { Controller, Get, Query } from "@nestjs/common";
import { CurrentWorkspace } from "../../common/decorators/current-workspace.decorator.js";
import { BalancesService } from "./balances.service.js";

@Controller("balances")
export class BalancesController {
  constructor(private readonly balances: BalancesService) {}

  @Get()
  list(
    @CurrentWorkspace() workspaceId: string,
    @Query("accountId") accountId?: string,
    @Query("asset") asset?: string
  ) {
    return this.balances.listBalances(workspaceId, { accountId, asset });
  }
}
