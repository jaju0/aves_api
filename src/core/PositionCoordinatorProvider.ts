import { WebsocketClient } from "bybit-api";
import { BybitRestClientProvider } from "./BybitRestClientProvider.js";
import { PositionCoordinator } from "./PositionCoordinator.js";
import { Position } from "../models/Position.js";
import { Credential } from "../models/Credential.js";
import { ResidualFeedProvider } from "./ResidualFeedProvider.js";
import { TickerFeedProvider } from "./TickerFeedProvider.js";

export class PositionCoordinatorProvider
{
    private bybitRestClientProvider: BybitRestClientProvider;
    private wsClient: WebsocketClient;
    private residualFeedProvider: ResidualFeedProvider;
    private tickerFeedProvider: TickerFeedProvider;

    private positionCoordinators: Map<string, PositionCoordinator>;

    constructor(bybitRestClientProvider: BybitRestClientProvider, wsClient: WebsocketClient, resiualFeedProvider: ResidualFeedProvider, tickerFeedProvider: TickerFeedProvider)
    {
        this.bybitRestClientProvider = bybitRestClientProvider;
        this.wsClient = wsClient;
        this.residualFeedProvider = resiualFeedProvider;
        this.tickerFeedProvider = tickerFeedProvider;
        this.positionCoordinators = new Map();
    }

    public get(apiKey: string, apiSecret: string, demoTrading: boolean)
    {
        let foundPositionCoordinator = this.positionCoordinators.get(apiKey);
        if(foundPositionCoordinator === undefined)
        {
            const restClient = this.bybitRestClientProvider.get(apiKey, apiSecret, demoTrading);
            foundPositionCoordinator = new PositionCoordinator(restClient, this.wsClient, this.residualFeedProvider, this.tickerFeedProvider);
            this.positionCoordinators.set(apiKey, foundPositionCoordinator);
        }

        return foundPositionCoordinator;
    }

    public async initialize()
    {
        const userIds = await Position.find({ open: true }).select(["ownerId"]);

        const credentials = await Credential.find({
            userId: { $in: userIds },
            isActive: true,
        });

        for(const credential of credentials)
        {
            let foundPositionCoordinator = this.positionCoordinators.get(credential.key);
            if(foundPositionCoordinator === undefined)
            {
                const restClient = this.bybitRestClientProvider.get(credential.key, credential.secret, credential.demoTrading);
                foundPositionCoordinator = new PositionCoordinator(restClient, this.wsClient, this.residualFeedProvider, this.tickerFeedProvider);
                this.positionCoordinators.set(credential.key, foundPositionCoordinator);
            }
        }
    }
}