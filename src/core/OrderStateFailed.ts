import Decimal from "decimal.js";
import { OrderState } from "./OrderState.js";
import { OrderContext } from "./OrderContext.js";

export class OrderStateFailed extends OrderState
{
    constructor(context: OrderContext)
    {
        super(context);

        this.context.order.failed = true;
        this.context.order.save();

        this.context.emit("failed");
    }

    public async initialize()
    {

    }

    public residualUpdate(residual: Decimal)
    {
    }
}