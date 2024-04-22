import { KlineIntervalV3 } from "bybit-api";
import { KlineProvider } from "./KlineProvider.js";
import { OLS } from "./statistics.js";

export interface Residual
{
    time: string;
    residual: number;
}

export interface ResidualSeries
{
    window: number;
    series: Residual[];
}

export class ResidualProvider
{
    private klineProvider: KlineProvider;
    private updateIntervalMs: number;
    private residuals: Map<string, Map<KlineIntervalV3, ResidualSeries>>;

    constructor(klineProvider: KlineProvider, updateIntervalMs: number)
    {
        this.klineProvider = klineProvider;
        this.updateIntervalMs = updateIntervalMs;
        this.residuals = new Map();

        setInterval(this.update.bind(this), this.updateIntervalMs);
    }

    public async get(symbol1: string, symbol2: string, interval: KlineIntervalV3, window: number)
    {
        const pair = `${symbol1}-${symbol2}`;

        let residualsMap = this.residuals.get(pair);
        let residualsSeries: ResidualSeries | undefined;
        if(residualsMap === undefined)
        {
            residualsSeries = {
                window,
                series: [],
            };

            residualsMap = new Map();
            residualsMap.set(interval, residualsSeries);
            this.residuals.set(pair, residualsMap);
        }

        residualsSeries = residualsMap.get(interval);
        if(residualsSeries === undefined)
        {
            residualsSeries = {
                window,
                series: [],
            };

            residualsMap.set(interval, residualsSeries);
        }

        if(residualsSeries.series.length > 0 && window <= residualsSeries.series.length)
            return residualsSeries.series.slice(-window);

        await this.fetch(symbol1, symbol2, interval, window, residualsSeries);

        return residualsSeries.series;
    }

    private async update()
    {
        for(const [pair, residualsEntry] of this.residuals.entries())
        {
            for(const [interval, series] of residualsEntry)
            {
                const [symbol1, symbol2] = pair.split("-");
                await this.fetch(symbol1, symbol2, interval, series.window, series);
            }
        }
    }

    private async fetch(symbol1: string, symbol2: string, interval: KlineIntervalV3, window: number, residualsSeries: ResidualSeries)
    {
        const symbol1Klines = await this.klineProvider.get(symbol1, interval, window);
        const symbol2Klines = await this.klineProvider.get(symbol2, interval, window);

        const symbol1ClosePrices = symbol1Klines.map(kline => +kline[4]);
        const symbol2ClosePrices = symbol2Klines.map(kline => +kline[4]);
        const timestamps = symbol1Klines.map(kline => kline[0]);

        const olsResult = OLS(symbol1ClosePrices, symbol2ClosePrices);
        const residuals = olsResult.residuals.toArray().map((value, index) => <Residual> {
            time: timestamps[index],
            residual: value.valueOf() as number,
        });

        residualsSeries.window = window;
        residualsSeries.series = residuals;
    }
}