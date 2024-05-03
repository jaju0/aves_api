import { expect, test } from "vitest";
import { RestClientV5 } from "bybit-api";
import { TickerProvider } from "../core/TickerProvider.js";

test("TickerProvider", async () => {
    const restClient = new RestClientV5();
    const tickerProvider = new TickerProvider(restClient);

    const ticker = tickerProvider.get("BTCUSDT");
    expect(ticker).toBeDefined();
});