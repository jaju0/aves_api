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
        if(this.context.symbol1OrderId === undefined || this.context.symbol2OrderId === undefined)
        {
            await this.context.transitionTo(new OrderStateFailed(this.context));
            return;
        }

        const symbol1OrderResponse = await this.context.restClient.getActiveOrders({ category: "linear", orderId: this.context.symbol1OrderId });
        const symbol2OrderResponse = await this.context.restClient.getActiveOrders({ category: "linear", orderId: this.context.symbol2OrderId });

        if(symbol1OrderResponse === undefined || symbol1OrderResponse.retCode !== 0 ||
            symbol2OrderResponse === undefined || symbol2OrderResponse.retCode !== 0 ||
            symbol1OrderResponse.result.list.length === 0 ||
            symbol2OrderResponse.result.list.length === 0
        )
        {
            await this.context.transitionTo(new OrderStateExecuted(this.context)); // retry
            return;
        }

        const symbol1OrderData = symbol1OrderResponse.result.list[0];
        const symbol2OrderData = symbol2OrderResponse.result.list[0];

        const symbol1FilledPrice = symbol1OrderData.avgPrice === "" || symbol1OrderData.avgPrice === "0" ? symbol1OrderData.price : symbol1OrderData.avgPrice;
        const symbol2FilledPrice = symbol2OrderData.avgPrice === "" || symbol2OrderData.avgPrice === "0" ? symbol2OrderData.price : symbol2OrderData.avgPrice;

        await this.context.positionCoordinator.submitToPosition({
            ownerId: this.context.order.ownerId,
            side: this.context.order.side === "Buy" ? "Long" : "Short",
            symbol1: this.context.order.symbol1,
            symbol2: this.context.order.symbol2,
            regressionSlope: this.context.order.regressionSlope,
            symbol1BaseQty: this.context.order.symbol1BaseQty,
            symbol2BaseQty: this.context.order.symbol2BaseQty,
            symbol1EntryPrice: symbol1FilledPrice,
            symbol2EntryPrice: symbol2FilledPrice,
        });

        this.context.order.status = "Executed";
        await this.context.order.save();

        this.context.emit("executed");
    }

    public residualUpdate(residual: Decimal)
    {
    }
}