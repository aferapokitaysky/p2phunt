import { Module } from "@nestjs/common";
import { PricingService } from "./pricing.service.js";
import { RatesController } from "./rates.controller.js";
import { RatesService } from "./rates.service.js";

@Module({
  controllers: [RatesController],
  providers: [RatesService, PricingService],
  exports: [RatesService, PricingService]
})
export class RatesModule {}
