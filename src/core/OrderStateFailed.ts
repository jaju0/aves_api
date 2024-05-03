import Decimal from "decimal.js";
import { OrderState } from "./OrderState.js";
import { OrderContext } from "./OrderContext.js";

export class OrderStateFailed extends OrderState
{
    constructor(context: OrderContext)
    {
        super(context);

        this.context.order.updateOne({
            failed: true,
        });

        this.context.emit("failed");
    }

    public async initialize()
    {

    }

    public residualUpdate(residual: Decimal)
    {
    }
}