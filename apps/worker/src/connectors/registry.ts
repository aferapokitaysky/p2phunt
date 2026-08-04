import {
  BinanceConnector,
  BybitConnector,
  ConnectorRegistry,
  CryptoBotConnector,
  MockConnector,
  WalletPayConnector,
  XRocketConnector
} from "@p2phunt/connectors";

export const connectorRegistry = new ConnectorRegistry();
connectorRegistry.register(new MockConnector());
connectorRegistry.register(new BinanceConnector());
connectorRegistry.register(new BybitConnector());
connectorRegistry.register(new CryptoBotConnector());
connectorRegistry.register(new XRocketConnector());
connectorRegistry.register(new WalletPayConnector());
