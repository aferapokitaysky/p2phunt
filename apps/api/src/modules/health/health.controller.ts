import { Controller, Get } from "@nestjs/common";
import { Public } from "../../common/decorators/public.decorator.js";

@Controller("health")
export class HealthController {
  @Public()
  @Get()
  getHealth() {
    return {
      ok: true,
      service: "p2phunt-api",
      timestamp: new Date().toISOString()
    };
  }
}
