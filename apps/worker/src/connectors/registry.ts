import { BinanceConnector, BybitConnector, ConnectorRegistry, MockConnector } from "@p2phunt/connectors";

export const connectorRegistry = new ConnectorRegistry();
connectorRegistry.register(new MockConnector());
connectorRegistry.register(new BinanceConnector());
connectorRegistry.register(new BybitConnector());
