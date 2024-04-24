import { RestClientV5 } from "bybit-api";
import { Order, OrderType, OrderSide } from "./models/Order.js";
import { InstrumentsInfoProvider } from "./InstrumentsInfoProvider.js";
import { TickerProvider } from "./TickerProvider.js";
import { Residual } from "./ResidualProvider.js";
import { OrderContext } from "./OrderContext.js";
import { OrderState } from "./OrderState.js";
import { OrderStateExecuted } from "OrderStateExecuted.js";

export interface OrderCreationParams
{
    type: OrderType;
    side: OrderSide;
    symbol1: string;
    symbol2: string;
    symbol1BaseQty?: string;
    symbol2BaseQty?: string;
    quoteQty?: string;
    price?: string;
    takeProfit?: string;
    stopLoss?: string;
}

export class OrderCoordinator
{
    private orderContexts: Map<string, OrderContext>;
    private restClient: RestClientV5;
    private instInfoProvider: InstrumentsInfoProvider;
    private tickerProvider: TickerProvider;

    private initPromise: Promise<void>;

    constructor(restClient: RestClientV5, instInfoProvider: InstrumentsInfoProvider, tickerProvider: TickerProvider)
    {
        this.orderContexts = new Map();
        this.restClient = restClient;
        this.instInfoProvider = instInfoProvider;
        this.tickerProvider = tickerProvider;

        this.initPromise = this.initialize();
    }

    public createOrder(params: OrderCreationParams)
    {
        const dbOrder = new Order({
            ...params,
            executed: false,
            failed: false,
        });

        dbOrder.save();

        const orderContext = new OrderContext(dbOrder, this.restClient, this.instInfoProvider, this.tickerProvider);
        orderContext.once("executed", this.orderExecuted.bind(this, dbOrder));
        this.orderContexts.set(dbOrder._id.toString(), orderContext);

        return orderContext;
    }

    public residualUpdate(residual: Residual)
    {
        for(const context of this.orderContexts.values())
            context.residualUpdate(residual);
    }

    public get OrderContexts()
    {
        return this.orderContexts;
    }

    public get InitPromise()
    {
        return this.initPromise;
    }

    private async initialize()
    {
        const dbOrders = await Order.find({
            executed: { $eq: false },
            failed: { $eq: false },
        });

        for(const dbOrder of dbOrders)
            this.orderContexts.set(dbOrder._id.toString(), new OrderContext(dbOrder, this.restClient, this.instInfoProvider, this.tickerProvider));
    }

    private orderExecuted(dbOrder: Order)
    {
        this.orderContexts.delete(dbOrder._id.toString());
    }
}