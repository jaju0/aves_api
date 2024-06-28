import EventEmitter from "events";
import { RestClientV5, WebsocketClient } from "bybit-api";
import Decimal from "decimal.js";
import { TradeFeed, WSTrade } from "./TradeFeed.js";

export class ResidualFeed extends EventEmitter<{
    "update": [Decimal]
}>
{
    private wsClient: WebsocketClient;
    private restClient: RestClientV5;

    private symbol1: string;
    private symbol2: string;

    private slope: Decimal;
    private symbol1TradeFeed: TradeFeed;
    private symbol2TradeFeed: TradeFeed;

    private latestSymbol1Price?: Decimal; // Y-Axis
    private latestSymbol2Price?: Decimal; // X-Axis

    private currentResidual?: Decimal;

    constructor(symbol1: string, symbol2: string, slope: Decimal, wsClient: WebsocketClient, restClient: RestClientV5)
    {
        super();
        this.wsClient = wsClient;
        this.restClient = restClient;
        this.symbol1 = symbol1;
        this.symbol2 = symbol2;
        this.slope = slope;
        this.symbol1TradeFeed = new TradeFeed(symbol1, this.wsClient);
        this.symbol2TradeFeed = new TradeFeed(symbol2, this.wsClient);
        this.symbol1TradeFeed.on("update", this.symbol1TradeUpdate.bind(this));
        this.symbol2TradeFeed.on("update", this.symbol2TradeUpdate.bind(this));

        this.getInitialPrices();
    }

    public shutdown()
    {
        this.symbol1TradeFeed.off("update", this.symbol1TradeUpdate.bind(this));
        this.symbol2TradeFeed.off("update", this.symbol2TradeUpdate.bind(this));
        this.symbol1TradeFeed.shutdown();
        this.symbol2TradeFeed.shutdown();
    }

    private async getInitialPrices()
    {
        const symbol1TickerResponse = await this.restClient.getTickers({
            category: "linear",
            symbol: this.symbol1,
        });

        if(symbol1TickerResponse.result.list.length)
        {
            const ticker = symbol1TickerResponse.result.list[0];
            this.latestSymbol1Price = new Decimal(ticker.lastPrice);
        }

        const symbol2TickerResponse = await this.restClient.getTickers({
            category: "linear",
            symbol: this.symbol2,
        });

        if(symbol2TickerResponse.result.list.length)
        {
            const ticker = symbol2TickerResponse.result.list[0];
            this.latestSymbol2Price = new Decimal(ticker.lastPrice);
        }
    }

    private priceUpdate()
    {
        if(this.latestSymbol1Price === undefined || this.latestSymbol2Price === undefined)
            return;

        const predictedSymbol1Price = this.slope.times(this.latestSymbol2Price);
        const residual = this.latestSymbol1Price.minus(predictedSymbol1Price);
        this.currentResidual = residual;
        this.emit("update", residual);
    }

    private symbol1TradeUpdate(trade: WSTrade)
    {
        this.latestSymbol1Price = new Decimal(trade.p);
        this.priceUpdate();
    }

    private symbol2TradeUpdate(trade: WSTrade)
    {
        this.latestSymbol2Price = new Decimal(trade.p);
        this.priceUpdate();
    }

    public get CurrentResidual()
    {
        return this.currentResidual;
    }
}