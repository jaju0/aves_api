import Decimal from "decimal.js";
import { Position, PositionSide } from "../models/Position.js";
import { TickerProvider } from "./TickerProvider.js";

export class PnlCalculator
{
    private tickerProvider: TickerProvider;

    constructor(tickerProvider: TickerProvider)
    {
        this.tickerProvider = tickerProvider;
    }

    public async get(position: Position)
    {
        const symbol1Pnl = await this.calculatePnl(position.symbol1, new Decimal(position.symbol1EntryPrice), new Decimal(position.symbol1BaseQty), position.side);
        const symbol2Pnl = await this.calculatePnl(position.symbol2, new Decimal(position.symbol2EntryPrice), new Decimal(position.symbol2BaseQty), position.side === "Long" ? "Short" : "Long");

        if(symbol1Pnl === undefined || symbol2Pnl === undefined)
            return undefined;

        return symbol1Pnl.plus(symbol2Pnl);
    }

    private async calculatePnl(symbol: string, entryPrice: Decimal, qty: Decimal, positionSide: PositionSide)
    {
        const ticker = await this.tickerProvider.get(symbol);
        if(ticker === undefined)
            return undefined;

        const lastTradedPrice = new Decimal(ticker.lastPrice);

        if(positionSide === "Long")
            return qty.times(lastTradedPrice.minus(entryPrice));
        else
            return qty.times(entryPrice.minus(lastTradedPrice));
    }
}