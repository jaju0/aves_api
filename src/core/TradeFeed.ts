import EventEmitter from "events";
import { WebsocketClient } from "bybit-api";

export interface WSTrade
{
    T: number;
    s: string;
    S: string;
    v: string;
    p: string;
    L: string;
    i: string;
    BT: boolean;
}

export class TradeFeed extends EventEmitter<{
    "update": [WSTrade],
}>
{
    private wsClient: WebsocketClient;
    private symbol: string;
    private topic: string;

    constructor(symbol: string, wsClient: WebsocketClient)
    {
        super();
        this.wsClient = wsClient;
        this.symbol = symbol;
        this.wsClient.on("update", this.websocketUpdate.bind(this));
        this.topic = `publicTrade.${symbol}`;
        this.wsClient.subscribeV5(this.topic, "linear").catch(reason => console.log(reason));
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

        const tradeData = response.data as WSTrade[];
        for(const trade of tradeData)
            this.emit("update", trade);
    }
}