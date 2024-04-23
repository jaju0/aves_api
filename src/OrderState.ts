import { OrderContextState } from "./OrderContext.js";
import { Residual } from "./ResidualProvider.js";

export abstract class OrderState
{
    protected transitionTo: (state: OrderContextState) => Promise<void>;

    constructor(transitionTo: (state: OrderContextState) => Promise<void>)
    {
        this.transitionTo = transitionTo;
    }

    abstract residualUpdate(residual: Residual): void;
}