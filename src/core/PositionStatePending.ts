import Decimal from "decimal.js";
import { PositionContext } from "./PositionContext.js";
import { PositionState } from "./PositionState.js";
import { PositionStateClosed } from "./PositionStateClosed.js";
import { ResidualFeed } from "./ResidualFeed.js";
import { TickerFeed } from "./TickerFeed.js";
import { PnlFeed } from "./PnlFeed.js";

export class PositionStatePending extends PositionState
{
    constructor(context: PositionContext)
    {
        super(context);

        if(!this.context.residualFeed)
        {
            this.context.residualFeed = new ResidualFeed(
                this.context.position.symbol1,
                this.context.position.symbol2,
                new Decimal(this.context.position.regressionSlope),
                this.context.wsClient
            );

            this.context.residualFeed.on("update", this.context.residualUpdate.bind(this.context));
        }

        if(!this.context.symbol1TickerFeed)
            this.context.symbol1TickerFeed = new TickerFeed(this.context.position.symbol1, this.context.wsClient);
        
        if(!this.context.symbol2TickerFeed)
            this.context.symbol2TickerFeed = new TickerFeed(this.context.position.symbol2, this.context.wsClient);

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
        let entryResidual: Decimal;
        {
            // y = mx+e
            const regressionSlope = new Decimal(this.context.position.regressionSlope);
            const predictedSymbol1Price = regressionSlope.times(this.context.position.symbol2EntryPrice);
            entryResidual = new Decimal(this.context.position.symbol1EntryPrice).minus(predictedSymbol1Price);
        }

        if(this.context.position.side === "Long")
        {
            const stopLoss = this.context.position.stopLoss === undefined ? undefined : entryResidual.minus(this.context.position.stopLoss);
            const takeProfit = this.context.position.takeProfit === undefined ? undefined : entryResidual.plus(this.context.position.takeProfit);

            const stopLossTriggered = stopLoss === undefined ? false : stopLoss.greaterThan(residual);
            const takeProfitTriggered = takeProfit === undefined ? false : takeProfit.lessThan(residual);

            if(stopLossTriggered || takeProfitTriggered)
                this.liquidate();
        }
        else if(this.context.position.side === "Short")
        {
            const stopLoss = this.context.position.stopLoss === undefined ? undefined : entryResidual.plus(this.context.position.stopLoss);
            const takeProfit = this.context.position.takeProfit === undefined ? undefined : entryResidual.minus(this.context.position.takeProfit);

            const stopLossTriggered = stopLoss === undefined ? false : stopLoss.lessThan(residual);
            const takeProfitTriggered = takeProfit === undefined ? false : takeProfit.greaterThan(residual);

            if(stopLossTriggered || takeProfitTriggered)
                this.liquidate();
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
        // TODO: save pnl update in database (maybe not on every call here; restrain it to a specific interval)
    }

    public async remove(symbol1BaseQty: Decimal, symbol1EntryPrice: Decimal, symbol2BaseQty: Decimal, symbol2EntryPrice: Decimal)
    {
        // TODO: remove from current position
    }

    public async liquidate()
    {
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

        this.context.transitionTo(new PositionStateClosed(this.context));
    }

}