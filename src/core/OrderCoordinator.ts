import { RestClientV5, WebsocketClient } from "bybit-api";
import { Order, OrderType, OrderSide } from "../models/Order.js";
import { InstrumentsInfoProvider } from "./InstrumentsInfoProvider.js";
import { TickerProvider } from "./TickerProvider.js";
import { OrderContext } from "./OrderContext.js";
import { PositionCoordinator } from "./PositionCoordinator.js";
import { ResidualFeedProvider } from "./ResidualFeedProvider.js";

export interface OrderCreationParams
{
    ownerId: string;
    type: OrderType;
    side: OrderSide;
    symbol1: string;
    symbol2: string;
    symbol1BaseQty?: string;
    symbol2BaseQty?: string;
    quoteQty?: string;
    symbol1EntryPrice?: string;
    symbol2EntryPrice?: string;
    regressionSlope: string;
    takeProfit?: string;
    stopLoss?: string;
}

export class OrderCoordinator
{
    private orderContexts: Map<string, OrderContext>;
    private userId: string;
    private restClient: RestClientV5;
    private wsClient: WebsocketClient;
    private residualFeedProvider: ResidualFeedProvider;
    private instInfoProvider: InstrumentsInfoProvider;
    private tickerProvider: TickerProvider;
    private positionCoordinator: PositionCoordinator;

    private initPromise: Promise<void>;

    constructor(userId: string, restClient: RestClientV5, wsClient: WebsocketClient, residualFeedProvider: ResidualFeedProvider, instInfoProvider: InstrumentsInfoProvider, tickerProvider: TickerProvider, positionCoordinator: PositionCoordinator)
    {
        this.orderContexts = new Map();
        this.userId = userId;
        this.restClient = restClient;
        this.wsClient = wsClient;
        this.residualFeedProvider = residualFeedProvider;
        this.instInfoProvider = instInfoProvider;
        this.tickerProvider = tickerProvider;
        this.positionCoordinator = positionCoordinator;

        this.initPromise = this.initialize();
    }

    public async createOrder(params: OrderCreationParams)
    {
        const dbOrder = new Order({
            ...params,
            status: "New",
        });

        await dbOrder.save();

        const orderContext = new OrderContext(dbOrder, this.restClient, this.wsClient, this.residualFeedProvider, this.instInfoProvider, this.tickerProvider, this.positionCoordinator);
        orderContext.once("executed", this.orderExecuted.bind(this, dbOrder, orderContext));
        this.orderContexts.set(dbOrder.id, orderContext);

        return orderContext;
    }

    public async cancelOrder(orderId: string)
    {
        const orderContext = this.orderContexts.get(orderId);
        if(orderContext === undefined)
            return;

        const order = await Order.findById(orderId);
        if(order != undefined)
        {
            order.status = "Failed";
            order.save();
        }

        orderContext.shutdown();
        this.orderContexts.delete(orderId);
    }

    public getOrderData(orderId: string)
    {
        return this.orderContexts.get(orderId);
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
            ownerId: this.userId,
            status: { $in: ["New", "Pending"] },
        });

        for(const dbOrder of dbOrders)
        {
            const orderContext = new OrderContext(dbOrder, this.restClient, this.wsClient, this.residualFeedProvider, this.instInfoProvider, this.tickerProvider, this.positionCoordinator);
            orderContext.once("executed", this.orderExecuted.bind(this, dbOrder, orderContext));
            this.orderContexts.set(dbOrder.id, orderContext);
        }
    }

    private orderExecuted(dbOrder: Order, orderContext: OrderContext)
    {
        orderContext.shutdown();
        this.orderContexts.delete(dbOrder.id);
    }
}