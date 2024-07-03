import EventEmitter from "events";
import { RestClientV5, WebsocketClient } from "bybit-api";
import Decimal from "decimal.js";
import { OrderState } from "./OrderState.js";
import { InstrumentsInfoProvider } from "./InstrumentsInfoProvider.js";
import { TickerProvider } from "./TickerProvider.js";
import { Order } from "../models/Order.js";
import { OrderStateExecuted } from "./OrderStateExecuted.js";
import { OrderStatePending } from "./OrderStatePending.js";
import { ResidualFeed } from "./ResidualFeed.js";
import { PositionCoordinator } from "./PositionCoordinator.js";
import { ResidualFeedProvider } from "./ResidualFeedProvider.js";

export class OrderContext extends EventEmitter<{
    "executed": [],
    "failed": [],
    "state_changed": [OrderState],
}>
{
    public readonly order: Order;
    public readonly restClient: RestClientV5;
    public readonly wsClient: WebsocketClient;
    public readonly residualFeedProvider: ResidualFeedProvider;
    public readonly instInfoProvider: InstrumentsInfoProvider;
    public readonly tickerProvider: TickerProvider;
    public readonly positionCoordinator: PositionCoordinator;

    public residualFeed?: ResidualFeed;
    public symbol1OrderId?: string;
    public symbol2OrderId?: string;

    private state?: OrderState;

    constructor(order: Order, restClient: RestClientV5, wsClient: WebsocketClient, residualFeedProvider: ResidualFeedProvider, instInfoProvider: InstrumentsInfoProvider, tickerProvider: TickerProvider, positionCoordinator: PositionCoordinator)
    {
        super();
        this.order = order;
        this.restClient = restClient;
        this.wsClient = wsClient;
        this.residualFeedProvider = residualFeedProvider;
        this.instInfoProvider = instInfoProvider;
        this.tickerProvider = tickerProvider;
        this.positionCoordinator = positionCoordinator;

        if(this.order.status === "Executed")
        {
            this.transitionTo(new OrderStateExecuted(this));
            return;
        }

        this.transitionTo(new OrderStatePending(this));
    }

    public async amendEntryPrices(symbol1EntryPrice: number, symbol2EntryPrice: number)
    {
        this.order.symbol1EntryPrice = symbol1EntryPrice.toString();
        this.order.symbol2EntryPrice = symbol2EntryPrice.toString();
        await this.order.save();
    }

    public async amendExitOrders(exitOrders: { takeProfit?: string | null, stopLoss?: string | null })
    {
        if(exitOrders.takeProfit !== undefined)
        {
            if(exitOrders.takeProfit === null)
                this.order.takeProfit = undefined;
            else
                this.order.takeProfit = exitOrders.takeProfit;
        }
        if(exitOrders.stopLoss !== undefined)
        {
            if(exitOrders.stopLoss === null)
                this.order.stopLoss = undefined;
            else
                this.order.stopLoss = exitOrders.stopLoss;
        }

        await this.order.save();
    }

    public async shutdown()
    {
        if(this.residualFeed)
        {
            this.residualFeed.off("update", this.residualUpdate.bind(this));
            this.residualFeedProvider.remove(this.residualFeed);
            this.residualFeed = undefined;
        }
    }

    public async transitionTo(state: OrderState)
    {
        this.state = state;
        await this.state.initialize();
        this.emit("state_changed", this.state);
    }

    public residualUpdate(residual: Decimal)
    {
        this.state?.residualUpdate(residual);
    }

    public get State()
    {
        return this.state;
    }
}