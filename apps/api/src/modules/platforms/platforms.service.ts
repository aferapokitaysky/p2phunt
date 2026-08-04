import { Injectable } from "@nestjs/common";
import { BinanceConnector, BybitConnector, ConnectorRegistry, MockConnector } from "@p2phunt/connectors";

@Injectable()
export class PlatformsService {
  private readonly registry = new ConnectorRegistry();

  constructor() {
    this.registry.register(new MockConnector());
    this.registry.register(new BinanceConnector());
    this.registry.register(new BybitConnector());
  }

  listConnectors() {
    return this.registry.list().map((connector) => connector.definition);
  }

  listPlatforms() {
    const platforms = new Map<string, { slug: string; name: string; category: string }>();

    for (const connector of this.registry.list()) {
      platforms.set(connector.definition.platform, {
        slug: connector.definition.platform,
        name: connector.definition.displayName,
        category: connector.definition.platformCategory
      });
    }

    return [...platforms.values()];
  }

  getConnector(slug: string) {
    return this.registry.get(slug);
  }
}
