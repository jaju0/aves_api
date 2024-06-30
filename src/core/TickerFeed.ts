import EventEmitter from "events";
import { TickerLinearInverseV5, WebsocketClient } from "bybit-api";

export class TickerFeed extends EventEmitter<{
    "update": [TickerLinearInverseV5],
}>
{
    private wsClient: WebsocketClient;
    private symbol: string;
    private topic: string;
    private ticker?: TickerLinearInverseV5;

    constructor(symbol: string, wsClient: WebsocketClient)
    {
        super();
        this.wsClient = wsClient;
        this.symbol = symbol;
        this.topic = `tickers.${symbol}`;
        this.wsClient.on("update", this.websocketUpdate.bind(this));
        this.wsClient.subscribeV5(this.topic, "linear");
    }

    public shutdown()
    {
        this.wsClient.unsubscribeV5(this.topic, "linear");
        this.wsClient.off("update", this.websocketUpdate.bind(this));
    }

    public get Symbol()
    {
        return this.symbol;
    }

    private websocketUpdate(response: any)
    {
        if(response.topic !== this.topic)
            return;

        if(response.data === undefined)
            return;

        if(response.type === "snapshot")
            this.ticker = response.data;
        else if(response.type === "delta" && this.ticker)
            Object.assign(this.ticker, response.data);

        if(this.ticker)
            this.emit("update", this.ticker);
    }
}