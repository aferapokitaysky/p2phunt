import { Controller, Get } from "@nestjs/common";
import { PlatformsService } from "./platforms.service.js";

@Controller()
export class PlatformsController {
  constructor(private readonly platforms: PlatformsService) {}

  @Get("platforms")
  listPlatforms() {
    return this.platforms.listPlatforms();
  }

  @Get("connectors")
  listConnectors() {
    return this.platforms.listConnectors();
  }
}
