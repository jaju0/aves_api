import EventEmitter from "events";
import { TickerLinearInverseV5, WebsocketClient } from "bybit-api";

export class TickerFeed extends EventEmitter<{
    "update": [TickerLinearInverseV5],
}>
{
    private wsClient: WebsocketClient;
    private topic: string;

    constructor(symbol: string, wsClient: WebsocketClient)
    {
        super();
        this.wsClient = wsClient;
        this.topic = `tickers.${symbol}`;
        this.wsClient.on("update", this.websocketUpdate.bind(this));
        this.wsClient.subscribeV5(this.topic, "linear");
    }

    public shutdown()
    {
        this.wsClient.unsubscribeV5(this.topic, "linear");
        this.wsClient.off("update", this.websocketUpdate.bind(this));
    }

    private websocketUpdate(response: any)
    {
        if(response.topic !== this.topic)
            return;

        if(response.data === undefined)
            return;

        this.emit("update", response.data);
    }
}