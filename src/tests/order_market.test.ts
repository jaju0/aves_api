import { expect, test } from "vitest";
import { RestClientV5 } from "bybit-api";
import { InstrumentsInfoProvider } from "../InstrumentsInfoProvider.js";
import { TickerProvider } from "../TickerProvider.js";
import { OrderContext } from "../OrderContext.js";
import { Order } from "../models/Order.js";

test("market order creation", {
    timeout: 30 * 1000,
}, async () => {
    const instInfo_refetchIntervalMs = 24 * 60 * 60 * 1000;

    const restClient = new RestClientV5({
        key: process.env.BYBIT_API_KEY,
        secret: process.env.BYBIT_API_SECRET,
        demoTrading: true,
    });

    const instInfoProvider = new InstrumentsInfoProvider(restClient, instInfo_refetchIntervalMs);
    const tickerProvider = new TickerProvider(restClient);

    const order = new Order({
        type: "Market",
        side: "Buy",
        symbol1: "BTCUSDT",
        symbol2: "ETHUSDT",
        symbol1BaseQty: "0.002",
        symbol2BaseQty: "0.03",
        //quoteQty: 100,
        //price: "",
        takeProfit: "10000",
        stopLoss: "-10000",
        executed: false,
        failed: false,
    });

    const orderContext = new OrderContext(order, restClient, instInfoProvider, tickerProvider);
    expect(orderContext.TransitionPromise).toBeDefined();
    if(orderContext.TransitionPromise)
        expect(await orderContext.TransitionPromise).toBeTruthy();
});