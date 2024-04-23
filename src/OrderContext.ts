import { RestClientV5 } from "bybit-api";
import { OrderState } from "./OrderState.js";
import { Residual } from "./ResidualProvider.js";
import { InstrumentsInfoProvider } from "./InstrumentsInfoProvider.js";
import { TickerProvider } from "./TickerProvider.js";
import { Order } from "./models/Order.js";
import { OrderStateExecuted } from "./OrderStateExecuted.js";
import { OrderStatePending } from "./OrderStatePending.js";
import { OrderTransitionExecute } from "./OrderTransitionExecute.js";

export type OrderContextState = "Pending" | "Executed";

export class OrderContext
{
    private order: Order;
    private restClient: RestClientV5;
    private instInfoProvider: InstrumentsInfoProvider;
    private tickerProvider: TickerProvider;

    private transitionPromise?: Promise<boolean>;
    private transitionExecute: OrderTransitionExecute;
    private state: OrderState;

    constructor(order: Order, restClient: RestClientV5, instInfoProvider: InstrumentsInfoProvider, tickerProvider: TickerProvider)
    {
        this.order = order;
        this.restClient = restClient;
        this.instInfoProvider = instInfoProvider;
        this.tickerProvider = tickerProvider;

        this.transitionExecute = new OrderTransitionExecute(this.order, this.restClient, this.instInfoProvider, this.tickerProvider);

        if(this.order.executed)
            this.state = new OrderStateExecuted(this.transitionTo.bind(this));

        this.state = new OrderStatePending(this.order, this.transitionTo.bind(this));
    }

    public async transitionTo(state: OrderContextState)
    {
        switch(state)
        {
        case "Executed":
            if(!(this.state instanceof OrderStateExecuted))
            {
                this.transitionPromise = this.transitionExecute.doTransition();
                if(await this.transitionPromise)
                    this.state = new OrderStateExecuted(this.transitionTo.bind(this));
            }
            break;
        default:
        }
    }

    public residualUpdate(residual: Residual)
    {
        this.state.residualUpdate(residual);
    }

    public get TransitionPromise()
    {
        return this.transitionPromise;
    }
}