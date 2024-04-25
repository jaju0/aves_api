import { expect, test } from "vitest";
import { RestClientV5, WebsocketClient } from "bybit-api";
import { setTimeout } from "timers/promises";
import { InstrumentsInfoProvider } from "../InstrumentsInfoProvider.js";
import { TickerProvider } from "../TickerProvider.js";
import { OrderCoordinator } from "../OrderCoordinator.js";

test("market order creation", {
    timeout: 30 * 1000,
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

    const orderCoordinator = new OrderCoordinator(restClient, wsClient, instInfoProvider, tickerProvider);

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
});