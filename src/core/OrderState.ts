import Decimal from "decimal.js";
import { OrderContext } from "./OrderContext.js";

export abstract class OrderState
{
    protected context: OrderContext;

    constructor(context: OrderContext)
    {
        this.context = context;
    }

    public abstract initialize(): Promise<void>;
    public abstract residualUpdate(residual: Decimal): void;
}