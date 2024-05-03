import { WebsocketClient } from "bybit-api";
import { BybitRestClientProvider } from "./BybitRestClientProvider.js";
import { OrderCoordinator } from "./OrderCoordinator.js";
import { InstrumentsInfoProvider } from "./InstrumentsInfoProvider.js";
import { TickerProvider } from "./TickerProvider.js";
import { PositionCoordinatorProvider } from "core/PositionCoordinatorProvider.js";

export class OrderCoordinatorProvider
{
    private bybitRestClientProvider: BybitRestClientProvider;
    private wsClient: WebsocketClient;
    private instInfoProvider: InstrumentsInfoProvider;
    private tickerProvider: TickerProvider;
    private positionCoordinatorProvider: PositionCoordinatorProvider;

    private orderCoordinators: Map<string, OrderCoordinator>;

    constructor(bybitRestClientProvider: BybitRestClientProvider, wsClient: WebsocketClient, instInfoProvider: InstrumentsInfoProvider, tickerProvider: TickerProvider, positionCoordinatorProvider: PositionCoordinatorProvider)
    {
        this.bybitRestClientProvider = bybitRestClientProvider;
        this.wsClient = wsClient;
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
            foundOrderCoordinator = new OrderCoordinator(restClient, this.wsClient, this.instInfoProvider, this.tickerProvider, positionCoordinator);
        }

        return foundOrderCoordinator;
    }


    // TODO: implement a function to load existing orders for startup
}