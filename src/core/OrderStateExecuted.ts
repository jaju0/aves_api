import Decimal from "decimal.js";
import { OrderState } from "./OrderState.js";
import { OrderContext } from "./OrderContext.js";
import { OrderStateFailed } from "./OrderStateFailed.js";

export class OrderStateExecuted extends OrderState
{
    constructor(context: OrderContext)
    {
        super(context);
    }

    public async initialize()
    {
        if(
            this.context.symbol1OrderId === undefined || this.context.symbol2OrderId === undefined ||
            this.context.order.symbol1EntryPrice === undefined || this.context.order.symbol2EntryPrice === undefined
        )
        {
            await this.context.transitionTo(new OrderStateFailed(this.context));
            return;
        }

        await this.context.positionCoordinator.submitToPosition({
            ownerId: this.context.order.ownerId,
            side: this.context.order.side === "Buy" ? "Long" : "Short",
            symbol1: this.context.order.symbol1,
            symbol2: this.context.order.symbol2,
            regressionSlope: this.context.order.regressionSlope,
            symbol1BaseQty: this.context.order.symbol1BaseQty,
            symbol2BaseQty: this.context.order.symbol2BaseQty,
            symbol1EntryPrice: this.context.order.symbol1EntryPrice,
            symbol2EntryPrice: this.context.order.symbol2EntryPrice,
            takeProfit: this.context.order.takeProfit,
            stopLoss: this.context.order.stopLoss,
        });

        this.context.order.status = "Executed";
        await this.context.order.save();

        this.context.emit("executed");
    }

    public residualUpdate(residual: Decimal)
    {
    }
}