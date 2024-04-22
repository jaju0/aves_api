import { test, expect } from "vitest";
import { OHLCVKlineV5, RestClientV5, WebsocketClient } from "bybit-api";
import { KlineProvider, WSKline } from "../KlineProvider.js";

test("KlineProvider", async () => {
    const restClient = new RestClientV5();
    const wsClient = new WebsocketClient({ market: "v5" });
    const klineProvider = new KlineProvider(restClient, wsClient);

    // get initial data via rest api and check the response
    const window = 2000;
    let klines = await klineProvider.get("BTCUSDT", "1", window);
    for(let i = 0; i < klines.length-1; ++i)
    {
        const current = klines[i];
        const next = klines[i+1];
        const expectedNextStartTime = (+current[0]+60000).toString();

        expect(+next[0], "start time is not in ascending order").toBeGreaterThan(+current[0]);
        expect(next[0], "start time of klines is not consecutive").toBe(expectedNextStartTime);
    }

    // call klineProvider.websocketUpdate and check if the data got update correctly
    let mostRecentKline = klines[klines.length-1];
    let lastKline: WSKline = {
        confirm: false,
        end: 0,
        interval: "1",
        timestamp: 0,
        start: +mostRecentKline[0],
        open: mostRecentKline[1],
        high: mostRecentKline[2],
        low: mostRecentKline[3],
        close: mostRecentKline[4],
        volume: mostRecentKline[5],
        turnover: mostRecentKline[6],
    }
    for(let i = 0; i < 100; ++i)
    {
        lastKline = {
            ...lastKline,
            close: (+lastKline.close+Math.random()).toString(),
            start: lastKline.confirm ? lastKline.start+60000 : lastKline.start,
            confirm: !lastKline.confirm,
        };
        klineProvider.websocketUpdate("BTCUSDT", "1", [lastKline]);
    }

    klines = await klineProvider.get("BTCUSDT", "1", window);
    for(let i = 0; i < klines.length-1; ++i)
    {
        const current = klines[i];
        const next = klines[i+1];
        const expectedNextStartTime = (+current[0]+60000).toString();

        expect(+next[0], "start time is not in ascending order").toBeGreaterThan(+current[0]);
        expect(next[0], "start time of klines is not consecutive").toBe(expectedNextStartTime);
    }

    expect(klines[klines.length-1][4], "latest close price does not match the expected close price after websocket update").toBe(lastKline.close);
    expect(klines.length).toEqual(window);

    // call remove function and check if the data was removed correctly
    klineProvider.remove("BTCUSDT", "1");
    const klineMap = klineProvider.Klines.get("BTCUSDT");
    expect(klineMap).toBeUndefined();
});