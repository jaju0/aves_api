import { WebsocketClient } from "bybit-api";
import { BybitRestClientProvider } from "./BybitRestClientProvider.js";
import { PositionCoordinator } from "./PositionCoordinator.js";
import { PnlCalculator } from "./PnlCalculator.js";

export class PositionCoordinatorProvider
{
    private bybitRestClientProvider: BybitRestClientProvider;
    private wsClient: WebsocketClient;
    private pnlCalculator: PnlCalculator;

    private positionCoordinators: Map<string, PositionCoordinator>;

    constructor(bybitRestClientProvider: BybitRestClientProvider, wsClient: WebsocketClient, pnlCalculator: PnlCalculator)
    {
        this.bybitRestClientProvider = bybitRestClientProvider;
        this.wsClient = wsClient;
        this.pnlCalculator = pnlCalculator;
        this.positionCoordinators = new Map();
    }

    public get(apiKey: string, apiSecret: string, demoTrading: boolean)
    {
        let foundPositionCoordinator = this.positionCoordinators.get(apiKey);
        if(foundPositionCoordinator === undefined)
        {
            const restClient = this.bybitRestClientProvider.get(apiKey, apiSecret, demoTrading);
            foundPositionCoordinator = new PositionCoordinator(restClient, this.wsClient, this.pnlCalculator);
            this.positionCoordinators.set(apiKey, foundPositionCoordinator);
        }

        return foundPositionCoordinator;
    }
}