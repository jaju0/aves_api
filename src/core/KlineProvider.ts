import { KlineIntervalV3, OHLCVKlineV5, RestClientV5, WebsocketClient } from "bybit-api";

export interface WSKline
{
    start: number;
    end: number;
    interval: KlineIntervalV3;
    open: string;
    close: string;
    high: string;
    low: string;
    volume: string;
    turnover: string;
    confirm: boolean;
    timestamp: number;
}

export interface KlineSeries
{
    window: number;
    series: OHLCVKlineV5[];
}

export class KlineProvider
{
    private restClient: RestClientV5;
    private wsClient: WebsocketClient;

    private klines: Map<string, Map<KlineIntervalV3, KlineSeries>>;

    constructor(restClient: RestClientV5, wsClient: WebsocketClient)
    {
        this.restClient = restClient;
        this.wsClient = wsClient;
        this.klines = new Map();
    }

    public async get(symbol: string, interval: KlineIntervalV3, window: number)
    {
        let seriesMap = this.klines.get(symbol);
        let seriesEntry: KlineSeries | undefined;
        if(seriesMap === undefined)
        {
            seriesEntry = {
                window,
                series: [],
            };

            seriesMap = new Map();
            seriesMap.set(interval, seriesEntry);
            this.klines.set(symbol, seriesMap);
        }

        seriesEntry = seriesMap.get(interval);
        if(seriesEntry === undefined)
        {
            seriesEntry = {
                window,
                series: [],
            };

            seriesMap.set(interval, seriesEntry);
        }

        if(seriesEntry.series.length === 0)
            this.subscribe(symbol, interval);

        if(seriesEntry.series.length < window)
        {
            seriesEntry.window = window;
            await this.fetchKlines(symbol, interval, seriesEntry);
        }

        return seriesEntry.series.slice(-window);
    }

    public remove(symbol: string, interval: KlineIntervalV3)
    {
        this.unsubscribe(symbol, interval);
        const seriesMap = this.klines.get(symbol);
        if(seriesMap !== undefined)
        {
            seriesMap.delete(interval);
            if(seriesMap.size === 0)
                this.klines.delete(symbol);
        }
    }

    public websocketUpdate(symbol: string, interval: KlineIntervalV3, klines: WSKline[])
    {
        const seriesMap = this.klines.get(symbol);
        if(seriesMap === undefined)
            return;

        const seriesEntry = seriesMap.get(interval);
        if(seriesEntry === undefined)
            return;

        for(const kline of klines)
        {
            const data: OHLCVKlineV5 = [
                kline.start.toString(),
                kline.open,
                kline.high,
                kline.low,
                kline.close,
                kline.volume,
                kline.turnover,
            ];

            if(seriesEntry.series.length === 0)
                seriesEntry.series.push(data);
            else
                seriesEntry.series[seriesEntry.series.length-1] = data;

            if(kline.confirm)
                seriesEntry.series.push(Array.from(data) as OHLCVKlineV5);
        }

        if(seriesEntry.series.length > seriesEntry.window)
            seriesEntry.series.splice(0, seriesEntry.series.length-seriesEntry.window);
    }

    public get Klines()
    {
        return this.klines;
    }

    private subscribe(symbol: string, interval: KlineIntervalV3)
    {
        this.wsClient.subscribeV5(`kline.${interval}.${symbol}`, "linear");
    }

    private unsubscribe(symbol: string, interval: KlineIntervalV3)
    {
        this.wsClient.unsubscribeV5(`kline.${interval}.${symbol}`, "linear");
    }

    private async fetchKlines(symbol: string, interval: KlineIntervalV3, klineSeries: KlineSeries)
    {
        while(klineSeries.series.length < klineSeries.window)
        {
            const klineResponse = await this.restClient.getKline({
                category: "linear",
                symbol,
                interval,
                end: klineSeries.series.length ? (+klineSeries.series[0][0]-1) : undefined,
                limit: 1000,
            });

            if(klineResponse === undefined || klineResponse.retCode !== 0)
                continue;

            klineSeries.series.unshift(...klineResponse.result.list.reverse());
        }
    }
}