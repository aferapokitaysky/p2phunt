import type { P2PConnector } from "./connector.js";

export class ConnectorRegistry {
  private readonly connectors = new Map<string, P2PConnector>();

  register(connector: P2PConnector): void {
    if (this.connectors.has(connector.definition.slug)) {
      throw new Error(`Connector already registered: ${connector.definition.slug}`);
    }

    this.connectors.set(connector.definition.slug, connector);
  }

  get(slug: string): P2PConnector {
    const connector = this.connectors.get(slug);

    if (!connector) {
      throw new Error(`Connector not found: ${slug}`);
    }

    return connector;
  }

  list(): P2PConnector[] {
    return [...this.connectors.values()];
  }
}
