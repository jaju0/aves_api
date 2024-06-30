import { WebsocketClient } from "bybit-api";
import { TickerFeed } from "./TickerFeed.js";

export class TickerFeedProvider
{
    private wsClient: WebsocketClient;
    private tickerFeeds: Map<string, [number, TickerFeed]>;

    constructor(wsClient: WebsocketClient)
    {
        this.wsClient = wsClient;
        this.tickerFeeds = new Map();
    }

    public get(symbol: string)
    {
        let tickerFeed = this.tickerFeeds.get(symbol);
        if(tickerFeed === undefined)
        {
            tickerFeed = [1, new TickerFeed(symbol, this.wsClient)];
            this.tickerFeeds.set(symbol, tickerFeed);
        }
        else
            tickerFeed[0]++;

        return tickerFeed[1];
    }

    public remove(tickerFeed: TickerFeed)
    {
        const found = this.tickerFeeds.get(tickerFeed.Symbol);
        if(found === undefined)
            return;

        found[0]--;

        if(found[0] <= 0)
        {
            found[1].removeAllListeners();
            found[1].shutdown();
            this.tickerFeeds.delete(tickerFeed.Symbol);
        }
    }
}