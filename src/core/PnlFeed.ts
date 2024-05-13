import EventEmitter from "events";
import { TickerLinearInverseV5 } from "bybit-api";
import Decimal from "decimal.js";
import { TickerFeed } from "./TickerFeed.js";
import { Position, PositionSide } from "../models/Position.js";

export class PnlFeed extends EventEmitter<{
    "update": [Decimal]
}>
{
    private position: Position;
    private symbol1TickerFeed: TickerFeed;
    private symbol2TickerFeed: TickerFeed;

    private symbol1Pnl?: Decimal;
    private symbol2Pnl?: Decimal;

    constructor(position: Position, symbol1TickerFeed: TickerFeed, symbol2TickerFeed: TickerFeed)
    {
        super();
        this.position = position;
        this.symbol1TickerFeed = symbol1TickerFeed;
        this.symbol2TickerFeed = symbol2TickerFeed;
        
        this.symbol1TickerFeed.on("update", this.onTickerUpdate.bind(this));
        this.symbol2TickerFeed.on("update", this.onTickerUpdate.bind(this));
    }

    public shutdown()
    {
        this.symbol1TickerFeed.off("update", this.onTickerUpdate.bind(this));
        this.symbol2TickerFeed.off("update", this.onTickerUpdate.bind(this));
    }

    private async onSymbol1TickerUpdate(ticker: TickerLinearInverseV5)
    {
        this.symbol1Pnl = await this.calculatePnl(ticker, this.position.symbol1, new Decimal(this.position.symbol1EntryPrice), new Decimal(this.position.symbol1BaseQty), this.position.side);
        return await this.onTickerUpdate();
    }

    private async onSymbol2TickerUpdate(ticker: TickerLinearInverseV5)
    {
        this.symbol2Pnl = await this.calculatePnl(ticker, this.position.symbol2, new Decimal(this.position.symbol2EntryPrice), new Decimal(this.position.symbol2BaseQty), this.position.side === "Long" ? "Short" : "Long");
        return await this.onTickerUpdate();
    }

    private async onTickerUpdate()
    {
        if(this.symbol1Pnl === undefined || this.symbol2Pnl === undefined)
            return;

        const totalPnl = this.symbol1Pnl.plus(this.symbol2Pnl);

        this.emit("update", totalPnl);
    }

    private async calculatePnl(ticker: TickerLinearInverseV5, symbol: string, entryPrice: Decimal, qty: Decimal, positionSide: PositionSide)
    {
        const lastTradedPrice = new Decimal(ticker.lastPrice);

        if(positionSide === "Long")
            return qty.times(lastTradedPrice.minus(entryPrice));
        else
            return qty.times(entryPrice.minus(lastTradedPrice));
    }
}