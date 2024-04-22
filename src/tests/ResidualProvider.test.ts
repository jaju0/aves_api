import { RestClientV5, WebsocketClient } from "bybit-api";
import { expect, test } from "vitest";
import { KlineProvider } from "../KlineProvider.js";
import { ResidualProvider } from "../ResidualProvider.js";

test("ResidualProvider", async () => {
    const restClient = new RestClientV5();
    const wsClient = new WebsocketClient({ market: "v5" });

    const window = 1000;

    const klineProvider = new KlineProvider(restClient, wsClient);
    const residualProvider = new ResidualProvider(klineProvider, 5000);

    const residuals = await residualProvider.get("BTCUSDT", "ETHUSDT", "1", window);

    expect(residuals.length, "number of residuals does not match the window length").toBe(window);

    for(let i = 0; i < residuals.length-1; ++i)
    {
        const current = residuals[i];
        const next = residuals[i+1];

        expect(+next.time, "time of residuals is not consecutive").toBe(+current.time+60000);
    }
});