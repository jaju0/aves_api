import EventEmitter from "events";
import { RestClientV5, WebsocketClient } from "bybit-api";
import Decimal from "decimal.js";
import { OrderState } from "./OrderState.js";
import { InstrumentsInfoProvider } from "./InstrumentsInfoProvider.js";
import { TickerProvider } from "./TickerProvider.js";
import { Order } from "./models/Order.js";
import { OrderStateExecuted } from "./OrderStateExecuted.js";
import { OrderStatePending } from "./OrderStatePending.js";
import { ResidualFeed } from "./ResidualFeed.js";
import { PositionCoordinator } from "./PositionCoordinator.js";

export class OrderContext extends EventEmitter<{
    "executed": [],
    "failed": [],
    "state_changed": [OrderState],
}>
{
    public readonly order: Order;
    public readonly restClient: RestClientV5;
    public readonly wsClient: WebsocketClient;
    public readonly instInfoProvider: InstrumentsInfoProvider;
    public readonly tickerProvider: TickerProvider;
    public readonly positionCoordinator: PositionCoordinator;

    public residualFeed?: ResidualFeed;
    public symbol1OrderId?: string;
    public symbol2OrderId?: string;

    private state: OrderState;

    constructor(order: Order, restClient: RestClientV5, wsClient: WebsocketClient, instInfoProvider: InstrumentsInfoProvider, tickerProvider: TickerProvider, positionCoordinator: PositionCoordinator)
    {
        super();
        this.order = order;
        this.restClient = restClient;
        this.wsClient = wsClient;
        this.instInfoProvider = instInfoProvider;
        this.tickerProvider = tickerProvider;
        this.positionCoordinator = positionCoordinator;

        if(this.order.executed)
            this.state = new OrderStateExecuted(this);

        this.state = new OrderStatePending(this);
    }

    public async shutdown()
    {
        this.residualFeed?.off("update", this.residualUpdate.bind(this));
        this.residualFeed?.shutdown();
    }

    public async transitionTo(state: OrderState)
    {
        this.state = state;
        await this.state.initialize();
        this.emit("state_changed", this.state);
    }

    public residualUpdate(residual: Decimal)
    {
        this.state.residualUpdate(residual);
    }

}