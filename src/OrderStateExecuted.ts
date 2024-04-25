import Decimal from "decimal.js";
import { OrderState } from "./OrderState.js";
import { OrderContext } from "./OrderContext.js";

export class OrderStateExecuted extends OrderState
{
    constructor(context: OrderContext)
    {
        super(context);

        this.context.order.updateOne({
            executed: true,
        });

        this.context.emit("executed");
        // TODO: create a position in this class
    }

    public async initialize()
    {

    }

    public residualUpdate(residual: Decimal)
    {
    }
}