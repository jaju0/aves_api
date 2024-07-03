import Decimal from "decimal.js";
import config from "../config.js";
import { PositionContext } from "./PositionContext.js";
import { PositionState } from "./PositionState.js";
import { PositionStateClosed } from "./PositionStateClosed.js";
import { PnlFeed } from "./PnlFeed.js";

export class PositionStatePending extends PositionState
{
    private lastPnlUpdateTimestamp: number;
    private isLiquidating: boolean;

    constructor(context: PositionContext)
    {
        super(context);
        this.lastPnlUpdateTimestamp = 0;
        this.isLiquidating = false;

        if(!this.context.residualFeed)
        {
            this.context.residualFeed = this.context.residualFeedProvider.get(this.context.position.symbol1, this.context.position.symbol2, new Decimal(this.context.position.regressionSlope));
            this.context.residualFeed.on("update", this.context.residualUpdate.bind(this.context));
        }

        if(!this.context.symbol1TickerFeed)
            this.context.symbol1TickerFeed = this.context.tickerFeedProvider.get(this.context.position.symbol1);
        
        if(!this.context.symbol2TickerFeed)
            this.context.symbol2TickerFeed = this.context.tickerFeedProvider.get(this.context.position.symbol2);

        if(!this.context.pnlFeed)
        {
            this.context.pnlFeed = new PnlFeed(this.context.position, this.context.symbol1TickerFeed, this.context.symbol2TickerFeed);
            this.context.pnlFeed.on("update", this.context.pnlUpdate.bind(this.context));
        }
    }

    public async initialize()
    {
    }

    public async residualUpdate(residual: Decimal)
    {
        const symbol1EntryPrice = new Decimal(this.context.position.symbol1EntryPrice);
        const symbol2EntryPrice = new Decimal(this.context.position.symbol2EntryPrice);
        const slope = new Decimal(this.context.position.regressionSlope);
        const entryResidual = symbol1EntryPrice.minus(slope.times(symbol2EntryPrice));

        const stopLoss = this.context.position.stopLoss === undefined ? undefined : entryResidual.plus(this.context.position.stopLoss);
        const takeProfit = this.context.position.takeProfit === undefined ? undefined : entryResidual.plus(this.context.position.takeProfit);

        if(this.context.position.side === "Long")
        {
            const stopLossTriggered = stopLoss === undefined ? false : stopLoss.greaterThan(residual);
            const takeProfitTriggered = takeProfit === undefined ? false : takeProfit.lessThan(residual);

            if(stopLossTriggered || takeProfitTriggered)
                await this.liquidate();
        }
        else if(this.context.position.side === "Short")
        {
            const stopLossTriggered = stopLoss === undefined ? false : stopLoss.lessThan(residual);
            const takeProfitTriggered = takeProfit === undefined ? false : takeProfit.greaterThan(residual);

            if(stopLossTriggered || takeProfitTriggered)
                await this.liquidate();
        }
    }

    public async add(symbol1BaseQty: Decimal, symbol1EntryPrice: Decimal, symbol2BaseQty: Decimal, symbol2EntryPrice: Decimal)
    {
        const oldSymbol1BaseQty = new Decimal(this.context.position.symbol1BaseQty);
        const oldSymbol1EntryPrice = new Decimal(this.context.position.symbol1EntryPrice);
        const oldSymbol1ContractValue = oldSymbol1BaseQty.times(oldSymbol1EntryPrice);

        const newSymbol1BaseQty = oldSymbol1BaseQty.plus(symbol1BaseQty);
        const newSymbol1ContractValue = symbol1BaseQty.times(symbol1EntryPrice);
        const newSymbol1EntryPrice = oldSymbol1ContractValue.plus(newSymbol1ContractValue).dividedBy(newSymbol1BaseQty);


        const oldSymbol2BaseQty = new Decimal(this.context.position.symbol2BaseQty);
        const oldSymbol2EntryPrice = new Decimal(this.context.position.symbol2EntryPrice);
        const oldSymbol2ContractValue = oldSymbol2BaseQty.times(oldSymbol2EntryPrice);

        const newSymbol2BaseQty = oldSymbol2BaseQty.plus(symbol2BaseQty);
        const newSymbol2ContractValue = symbol2BaseQty.times(symbol2EntryPrice);
        const newSymbol2EntryPrice = oldSymbol2ContractValue.plus(newSymbol2ContractValue).dividedBy(newSymbol2BaseQty);


        this.context.position.symbol1BaseQty = newSymbol1BaseQty.toString();
        this.context.position.symbol1EntryPrice = newSymbol1EntryPrice.toString();
        this.context.position.symbol2BaseQty = newSymbol2BaseQty.toString();
        this.context.position.symbol2EntryPrice = newSymbol2EntryPrice.toString();
        await this.context.position.save();
    }

    public async pnlUpdate(pnl: Decimal)
    {
        if(pnl.eq(this.context.position.lastPnl))
            return;

        this.context.position.lastPnl = pnl.toString();
        const now = Date.now();
        const currentPnlUpdateTimestamp = now - now % config.POSITION_PNL_UPDATE_INTERVAL_MS;
        if(currentPnlUpdateTimestamp > this.lastPnlUpdateTimestamp)
            this.context.position.save();

        this.lastPnlUpdateTimestamp = currentPnlUpdateTimestamp;
    }

    public async remove(symbol1BaseQty: Decimal, symbol1EntryPrice: Decimal, symbol2BaseQty: Decimal, symbol2EntryPrice: Decimal)
    {
        // TODO: remove from current position
    }

    public async liquidate()
    {
        if(this.isLiquidating)
            return;

        this.isLiquidating = true;

        await this.context.restClient.submitOrder({
            category: "linear",
            orderType: "Market",
            side: this.context.position.side === "Long" ? "Sell" : "Buy",
            symbol: this.context.position.symbol1,
            qty: this.context.position.symbol1BaseQty.toString(),
        });

        await this.context.restClient.submitOrder({
            category: "linear",
            orderType: "Market",
            side: this.context.position.side === "Long" ? "Buy" : "Sell",
            symbol: this.context.position.symbol2,
            qty: this.context.position.symbol2BaseQty.toString(),
        });

        await this.context.transitionTo(new PositionStateClosed(this.context));
    }

}