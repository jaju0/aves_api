import Decimal from "decimal.js";
import { OrderState } from "./OrderState.js";
import { OrderContext } from "./OrderContext.js";

export class OrderStateFailed extends OrderState
{
    constructor(context: OrderContext)
    {
        super(context);
    }

    public async initialize()
    {

        this.context.order.status = "Failed";
        await this.context.order.save();

        this.context.emit("failed");
    }

    public residualUpdate(residual: Decimal)
    {
    }
}