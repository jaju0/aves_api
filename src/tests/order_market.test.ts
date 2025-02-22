import { expect, test } from "vitest";
import { RestClientV5, WebsocketClient } from "bybit-api";
import { setTimeout } from "timers/promises";
import { InstrumentsInfoProvider } from "../core/InstrumentsInfoProvider.js";
import { TickerProvider } from "../core/TickerProvider.js";
import { OrderCoordinator } from "../core/OrderCoordinator.js";
import { PositionCoordinator } from "../core/PositionCoordinator.js";
import { PnlCalculator } from "../core/PnlCalculator.js";

test("market order creation", {
    timeout: 40 * 1000,
}, async () => {
    const instInfo_refetchIntervalMs = 24 * 60 * 60 * 1000;

    const restClient = new RestClientV5({
        key: process.env.BYBIT_API_KEY,
        secret: process.env.BYBIT_API_SECRET,
        demoTrading: true,
    });

    const wsClient = new WebsocketClient({
        market: "v5",
    });

    const instInfoProvider = new InstrumentsInfoProvider(restClient, instInfo_refetchIntervalMs);
    const tickerProvider = new TickerProvider(restClient);
    const pnlCalculator = new PnlCalculator(tickerProvider);

    const positionCoordinator = new PositionCoordinator(restClient, wsClient, pnlCalculator);
    const orderCoordinator = new OrderCoordinator(restClient, wsClient, instInfoProvider, tickerProvider, positionCoordinator);

    const orderContext = orderCoordinator.createOrder({
        type: "Market",
        side: "Buy",
        symbol1: "BTCUSDT",
        symbol2: "ETHUSDT",
        symbol1BaseQty: "0.002",
        symbol2BaseQty: "0.03",
        regressionSlope: "0",
        //quoteQty: 100,
        //price: "",
        takeProfit: "10000",
        stopLoss: "-10000",
    });

    expect(orderCoordinator.OrderContexts.size).toBe(1);
    await setTimeout(5 * 1000); // wait five seconds for order to be executed
    expect(orderCoordinator.OrderContexts.size, "order context still running after 5 seconds").toBe(0);
    await positionCoordinator.liquidateAll();
    expect(positionCoordinator.PositionContexts.size).toBe(1);

    await positionCoordinator.shutdown();
    wsClient.closeAll(true);
});