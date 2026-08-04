import { Global, Module } from "@nestjs/common";
import { RealtimeModule } from "../realtime/realtime.module.js";
import { EventsService } from "./events.service.js";
import { RedisEventsSubscriber } from "./redis-events.subscriber.js";

@Global()
@Module({
  imports: [RealtimeModule],
  providers: [EventsService, RedisEventsSubscriber],
  exports: [EventsService]
})
export class EventsModule {}
