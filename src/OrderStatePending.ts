import { Residual } from "./ResidualProvider.js";
import { OrderState } from "./OrderState.js";
import { OrderContextState } from "./OrderContext.js";
import { Order } from "./models/Order.js";

type TriggerDirection = "None" | "FromTop" | "FromBottom";

export class OrderStatePending extends OrderState
{
    private order: Order;
    private price?: number;
    private triggerDirection: TriggerDirection;

    constructor(order: Order, transitionTo: (state: OrderContextState) => Promise<void>)
    {
        super(transitionTo);
        this.order = order;

        this.triggerDirection = "None";
        if(this.order.type === "Market")
        {
            transitionTo("Executed");
            return;
        }
        else if(this.order.type === "Limit")
            this.triggerDirection = this.order.side === "Buy" ? "FromTop" : "FromBottom";
        else if(this.order.type === "Stop")
            this.triggerDirection = this.order.side === "Buy" ? "FromBottom" : "FromTop";

        if(this.order.price === undefined)
            throw new Error("order is of type limit/stop and price is not set");

        this.price = +this.order.price;
    }

    public residualUpdate(residual: Residual)
    {
        if(this.price === undefined)
            return;

        const fromBottomTriggered = this.triggerDirection === "FromBottom" && residual.residual > this.price;
        const fromTopTriggered = this.triggerDirection === "FromTop" && residual.residual < this.price;
        const triggered = fromBottomTriggered || fromTopTriggered;

        if(triggered)
            this.transitionTo("Executed");
    }

}