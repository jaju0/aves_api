import { WebsocketClient } from "bybit-api";
import { TradeFeed } from "./TradeFeed.js";

export class TradeFeedProvider
{
    private wsClient: WebsocketClient;
    private tradeFeeds: Map<string, [number, TradeFeed]>;

    constructor(wsClient: WebsocketClient)
    {
        this.wsClient = wsClient;
        this.tradeFeeds = new Map();
    }

    public get(symbol: string)
    {
        let tradeFeed = this.tradeFeeds.get(symbol);
        if(tradeFeed === undefined)
        {
            tradeFeed = [1, new TradeFeed(symbol, this.wsClient)];
            this.tradeFeeds.set(symbol, tradeFeed);
        }
        else
            tradeFeed[0]++;

        return tradeFeed[1];
    }

    public remove(tradeFeed: TradeFeed)
    {
        const found = this.tradeFeeds.get(tradeFeed.Symbol);
        if(found === undefined)
            return;

        found[0]--;

        if(found[0] <= 0)
        {
            found[1].removeAllListeners();
            found[1].shutdown();
            this.tradeFeeds.delete(tradeFeed.Symbol);
        }
    }
}