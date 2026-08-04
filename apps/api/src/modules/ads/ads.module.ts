import { Module } from "@nestjs/common";
import { CommandsModule } from "../commands/commands.module.js";
import { AdsController } from "./ads.controller.js";
import { AdsService } from "./ads.service.js";

@Module({
  imports: [CommandsModule],
  controllers: [AdsController],
  providers: [AdsService]
})
export class AdsModule {}
