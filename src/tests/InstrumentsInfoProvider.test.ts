import { expect, test } from "vitest";
import { RestClientV5 } from "bybit-api";
import { InstrumentsInfoProvider } from "../core/InstrumentsInfoProvider.js";

test("InstrumentInfoProvider", async () => {
    const refreshIntervalMs = 24 * 60 * 60 * 1000;
    const restClient = new RestClientV5();
    const instInfoProvider = new InstrumentsInfoProvider(restClient, refreshIntervalMs);

    const instInfo = await instInfoProvider.get("BTCUSDT");
    expect(instInfo).toBeDefined();
});