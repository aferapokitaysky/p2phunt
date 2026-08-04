import { Module } from "@nestjs/common";
import { MarkupsController } from "./markups.controller.js";
import { MarkupsService } from "./markups.service.js";

@Module({
  controllers: [MarkupsController],
  providers: [MarkupsService]
})
export class MarkupsModule {}
