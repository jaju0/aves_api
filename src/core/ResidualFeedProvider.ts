import Decimal from "decimal.js";
import { ResidualFeed } from "./ResidualFeed.js";
import { TradeFeedProvider } from "./TradeFeedProvider.js";
import { RestClientV5 } from "bybit-api";

export class ResidualFeedProvider
{
    private restClient: RestClientV5;
    private tradeFeedProvider: TradeFeedProvider;
    private residualFeeds: Map<string, [number, ResidualFeed]>;

    constructor(tradeFeedProvider: TradeFeedProvider, restClient: RestClientV5)
    {
        this.restClient = restClient;
        this.tradeFeedProvider = tradeFeedProvider;
        this.residualFeeds = new Map();
    }

    public get(symbol1: string, symbol2: string, slope: Decimal)
    {
        const key = `${symbol1}-${symbol2}-${slope.toString()}`;
        let residualFeed = this.residualFeeds.get(key);
        if(residualFeed === undefined)
        {
            residualFeed = [1, new ResidualFeed(symbol1, symbol2, slope, this.tradeFeedProvider, this.restClient)];
            this.residualFeeds.set(key, residualFeed);
        }
        else
            residualFeed[0]++;

        return residualFeed[1];
    }

    public remove(residualFeed: ResidualFeed)
    {
        const key = `${residualFeed.Symbol1}-${residualFeed.Symbol2}-${residualFeed.Slope.toString()}`;
        const found = this.residualFeeds.get(key);
        if(found === undefined)
            return;

        found[0]--;

        if(found[0] <= 0)
        {
            found[1].removeAllListeners(),
            found[1].shutdown();
            this.residualFeeds.delete(key);
        }
    }
}