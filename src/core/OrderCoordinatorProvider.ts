import { WebsocketClient } from "bybit-api";
import { BybitRestClientProvider } from "./BybitRestClientProvider.js";
import { OrderCoordinator } from "./OrderCoordinator.js";
import { InstrumentsInfoProvider } from "./InstrumentsInfoProvider.js";
import { TickerProvider } from "./TickerProvider.js";
import { PositionCoordinatorProvider } from "core/PositionCoordinatorProvider.js";
import { Order } from "../models/Order.js";
import { Credential } from "../models/Credential.js";
import { ResidualFeedProvider } from "./ResidualFeedProvider.js";

export class OrderCoordinatorProvider
{
    private bybitRestClientProvider: BybitRestClientProvider;
    private wsClient: WebsocketClient;
    private residualFeedProvider: ResidualFeedProvider;
    private instInfoProvider: InstrumentsInfoProvider;
    private tickerProvider: TickerProvider;
    private positionCoordinatorProvider: PositionCoordinatorProvider;

    private orderCoordinators: Map<string, OrderCoordinator>;

    constructor(bybitRestClientProvider: BybitRestClientProvider, wsClient: WebsocketClient, residualFeedProvider: ResidualFeedProvider, instInfoProvider: InstrumentsInfoProvider, tickerProvider: TickerProvider, positionCoordinatorProvider: PositionCoordinatorProvider)
    {
        this.bybitRestClientProvider = bybitRestClientProvider;
        this.wsClient = wsClient;
        this.residualFeedProvider = residualFeedProvider;
        this.instInfoProvider = instInfoProvider;
        this.tickerProvider = tickerProvider;
        this.positionCoordinatorProvider = positionCoordinatorProvider;
        this.orderCoordinators = new Map();
    }

    public get(apiKey: string, apiSecret: string, demoTrading: boolean)
    {
        let foundOrderCoordinator = this.orderCoordinators.get(apiKey);
        if(foundOrderCoordinator === undefined)
        {
            const restClient = this.bybitRestClientProvider.get(apiKey, apiSecret, demoTrading);
            const positionCoordinator = this.positionCoordinatorProvider.get(apiKey, apiSecret, demoTrading);
            foundOrderCoordinator = new OrderCoordinator(restClient, this.wsClient, this.residualFeedProvider, this.instInfoProvider, this.tickerProvider, positionCoordinator);
            this.orderCoordinators.set(apiKey, foundOrderCoordinator);
        }

        return foundOrderCoordinator;
    }

    public async initialize()
    {
        const userIds = await Order.find({
            status: { $in: ["New", "Pending"] },
        }).select(["ownerId"]);

        const credentials = await Credential.find({
            userId: { $in: userIds },
            isActive: true,
        });

        for(const credential of credentials)
        {
            let foundOrderCoordinator = this.orderCoordinators.get(credential.key);
            if(foundOrderCoordinator === undefined)
            {
                const restClient = this.bybitRestClientProvider.get(credential.key, credential.secret, credential.demoTrading);
                const positionCoordinator = this.positionCoordinatorProvider.get(credential.key, credential.secret, credential.demoTrading);
                foundOrderCoordinator = new OrderCoordinator(restClient, this.wsClient, this.residualFeedProvider, this.instInfoProvider, this.tickerProvider, positionCoordinator);
                this.orderCoordinators.set(credential.key, foundOrderCoordinator);
            }
        }
    }
}