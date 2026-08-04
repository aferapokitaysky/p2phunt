import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { AccountsModule } from "./accounts/accounts.module.js";
import { AuditModule } from "./audit/audit.module.js";
import { AuthModule } from "./auth/auth.module.js";
import { AutomationModule } from "./automation/automation.module.js";
import { CryptoModule } from "./crypto/crypto.module.js";
import { DashboardModule } from "./dashboard/dashboard.module.js";
import { DealsModule } from "./deals/deals.module.js";
import { EventsModule } from "./events/events.module.js";
import { HealthModule } from "./health/health.module.js";
import { LogsModule } from "./logs/logs.module.js";
import { MarkupsModule } from "./markups/markups.module.js";
import { NotificationsModule } from "./notifications/notifications.module.js";
import { PlatformsModule } from "./platforms/platforms.module.js";
import { PrismaModule } from "./prisma/prisma.module.js";
import { QueueModule } from "./queue/queue.module.js";
import { RatesModule } from "./rates/rates.module.js";
import { RealtimeModule } from "./realtime/realtime.module.js";
import { AdsModule } from "./ads/ads.module.js";
import { BalancesModule } from "./balances/balances.module.js";
import { CommandsModule } from "./commands/commands.module.js";
import { MarketModule } from "./market/market.module.js";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,
    CryptoModule,
    AuditModule,
    QueueModule,
    EventsModule,
    AuthModule,
    HealthModule,
    PlatformsModule,
    AccountsModule,
    DealsModule,
    BalancesModule,
    AdsModule,
    RatesModule,
    MarkupsModule,
    AutomationModule,
    NotificationsModule,
    LogsModule,
    CommandsModule,
    MarketModule,
    DashboardModule,
    RealtimeModule
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }]
})
export class AppModule {}
