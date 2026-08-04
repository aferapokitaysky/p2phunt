import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { WorkspaceGateway } from "./workspace.gateway.js";

@Module({
  imports: [JwtModule.register({})],
  providers: [WorkspaceGateway],
  exports: [WorkspaceGateway]
})
export class RealtimeModule {}
