import { Residual } from "./ResidualProvider.js";
import { OrderState } from "./OrderState.js";
import { OrderContextState } from "./OrderContext.js";

export class OrderStateExecuted extends OrderState
{
    constructor(transitionTo: (state: OrderContextState) => Promise<void>)
    {
        super(transitionTo);
        // TODO: create a position in this class
    }

    public residualUpdate(residual: Residual)
    {
    }
}