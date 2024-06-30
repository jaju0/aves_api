import Decimal from "decimal.js";
import { OrderState } from "./OrderState.js";
import { OrderContext } from "./OrderContext.js";
import { OrderStateExecute } from "./OrderStateExecute.js";
import { OrderStateFailed } from "./OrderStateFailed.js";

type TriggerDirection = "None" | "FromTop" | "FromBottom";

export class OrderStatePending extends OrderState
{
    private isTriggered: boolean;
    private triggerDirection: TriggerDirection;

    constructor(context: OrderContext)
    {
        super(context);
        this.isTriggered = false;
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
        {
            this.context.transitionTo(new OrderStateFailed(this.context));
            return;
        }

        if(!this.context.residualFeed)
        {
            this.context.residualFeed = this.context.residualFeedProvider.get(this.context.order.symbol1, this.context.order.symbol2, new Decimal(this.context.order.regressionSlope));
            this.context.residualFeed.on("update", this.context.residualUpdate.bind(this.context));
        }
    }

    public async residualUpdate(residual: Decimal)
    {
        if(this.isTriggered)
            return;

        if(this.context.order.entryResidual === undefined)
        {
            this.isTriggered = true;
            this.context.transitionTo(new OrderStateFailed(this.context));
            return;
        }

        const entryResidual = +this.context.order.entryResidual;
        if(entryResidual === undefined)
            return;

        const fromBottomTriggered = this.triggerDirection === "FromBottom" && residual.greaterThan(entryResidual);
        const fromTopTriggered = this.triggerDirection === "FromTop" && residual.lessThan(entryResidual);
        const triggered = fromBottomTriggered || fromTopTriggered;

        if(triggered && !(this.context.State instanceof OrderStateExecute))
        {
            this.isTriggered = true;
            await this.context.transitionTo(new OrderStateExecute(this.context));
        }
    }

}