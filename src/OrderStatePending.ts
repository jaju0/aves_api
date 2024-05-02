import Decimal from "decimal.js";
import { OrderState } from "./OrderState.js";
import { OrderContext } from "./OrderContext.js";
import { OrderStateExecute } from "./OrderStateExecute.js";
import { ResidualFeed } from "./ResidualFeed.js";

type TriggerDirection = "None" | "FromTop" | "FromBottom";

export class OrderStatePending extends OrderState
{
    private entryResidual?: number;
    private triggerDirection: TriggerDirection;

    constructor(context: OrderContext)
    {
        super(context);
        this.triggerDirection = "None";
    }

    public async initialize()
    {
        if(this.context.order.type === "Market")
        {
            await this.context.transitionTo(new OrderStateExecute(this.context));
            return;
        }
        else if(this.context.order.type === "Limit")
            this.triggerDirection = this.context.order.side === "Buy" ? "FromTop" : "FromBottom";
        else if(this.context.order.type === "Stop")
            this.triggerDirection = this.context.order.side === "Buy" ? "FromBottom" : "FromTop";

        if(this.context.order.entryResidual === undefined)
            throw new Error("order is of type limit/stop and price is not set");

        this.entryResidual = +this.context.order.entryResidual;

        this.context.residualFeed = new ResidualFeed(
            this.context.order.symbol1,
            this.context.order.symbol2,
            new Decimal(this.context.order.regressionSlope),
            this.context.wsClient
        );

        this.context.residualFeed.on("update", this.context.residualUpdate.bind(this.context));
    }

    public async residualUpdate(residual: Decimal)
    {
        if(this.entryResidual === undefined)
            return;

        const fromBottomTriggered = this.triggerDirection === "FromBottom" && residual.greaterThan(this.entryResidual);
        const fromTopTriggered = this.triggerDirection === "FromTop" && residual.lessThan(this.entryResidual);
        const triggered = fromBottomTriggered || fromTopTriggered;

        if(triggered)
            this.context.transitionTo(new OrderStateExecute(this.context));
    }

}