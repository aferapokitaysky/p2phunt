import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { AppExceptionFilter } from "./common/filters/http-exception.filter.js";
import { AppModule } from "./modules/app.module.js";

const DEV_DEFAULTS: Record<string, string> = {
  JWT_ACCESS_SECRET: "change-me-access",
  JWT_REFRESH_SECRET: "change-me-refresh",
  ENCRYPTION_KEY: "change-me-32-byte-minimum-development-key"
};

/**
 * These three secrets fall back to well-known dev defaults (committed in plaintext in this
 * repo) when unset, so local `pnpm dev` works with zero setup. That same fallback would be
 * a critical vulnerability in production — anyone could forge auth tokens or decrypt every
 * stored exchange API key. Refuse to boot with NODE_ENV=production until they're overridden.
 */
function assertProductionSecretsAreSet(config: ConfigService) {
  if (config.get<string>("NODE_ENV") !== "production") return;

  const insecure = Object.entries(DEV_DEFAULTS).filter(([key, devValue]) => config.get<string>(key) === devValue);
  if (insecure.length > 0) {
    throw new Error(
      `Refusing to start in production with dev-default secrets: ${insecure.map(([key]) => key).join(", ")}. ` +
        "Set real values for these environment variables before deploying."
    );
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  assertProductionSecretsAreSet(config);
  const webOrigin = config.get<string>("WEB_ORIGIN", "http://localhost:5173");

  app.enableCors({
    origin: webOrigin,
    credentials: true
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true
    })
  );
  app.useGlobalFilters(new AppExceptionFilter());

  const port = config.get<number>("API_PORT", 4000);
  await app.listen(port);
}

void bootstrap();
