import { Module } from "@nestjs/common";
import { PlatformsModule } from "../platforms/platforms.module.js";
import { AccountsController } from "./accounts.controller.js";
import { AccountsService } from "./accounts.service.js";

@Module({
  imports: [PlatformsModule],
  controllers: [AccountsController],
  providers: [AccountsService],
  exports: [AccountsService]
})
export class AccountsModule {}
