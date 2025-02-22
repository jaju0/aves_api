import { RestClientV5, WebsocketClient } from "bybit-api";
import Decimal from "decimal.js";
import { PositionContext } from "./PositionContext.js";
import { Position, PositionSide } from "../models/Position.js";
import { ResidualFeedProvider } from "./ResidualFeedProvider.js";
import { TickerFeedProvider } from "./TickerFeedProvider.js";

export interface AddToPositionParams
{
    ownerId: string;
    side: PositionSide;
    symbol1: string;
    symbol2: string;
    symbol1EntryPrice: string;
    symbol2EntryPrice: string;
    symbol1BaseQty: string;
    symbol2BaseQty: string;
    regressionSlope: string;
    takeProfit?: string;
    stopLoss?: string;
}

export class PositionCoordinator
{
    public readonly positionContexts: Map<string, PositionContext>;
    public readonly initPromise: Promise<void>;

    private userId: string;
    private restClient: RestClientV5;
    private wsClient: WebsocketClient;
    private residualFeedProvider: ResidualFeedProvider;
    private tickerFeedProvider: TickerFeedProvider;

    constructor(userId: string, restClient: RestClientV5, wsClient: WebsocketClient, residualFeedProvider: ResidualFeedProvider, tickerFeedProvider: TickerFeedProvider)
    {
        this.positionContexts = new Map();
        this.userId = userId;
        this.restClient = restClient;
        this.wsClient = wsClient;
        this.residualFeedProvider = residualFeedProvider;
        this.tickerFeedProvider = tickerFeedProvider;

        this.initPromise = this.initialize();
    }

    public async submitToPosition(params: AddToPositionParams)
    {
        const symbol1BaseQty = new Decimal(params.symbol1BaseQty);
        const symbol2BaseQty = new Decimal(params.symbol2BaseQty);

        const symbol1EntryPrice = new Decimal(params.symbol1EntryPrice);
        const symbol2EntryPrice = new Decimal(params.symbol2EntryPrice);

        const contextKey = `${params.ownerId}-${params.symbol1}-${params.symbol2}`;
        let context = this.positionContexts.get(contextKey);
        if(context !== undefined)
        {
            const isAddToPosition = (
                (context.position.side === "Long" && params.side === "Long") ||
                (context.position.side === "Short" && params.side === "Short")
            );

            const isRemoveFromPosition = (
                (context.position.side === "Long" && params.side === "Short") ||
                (context.position.side === "Short" && params.side === "Long")
            );

            if(isAddToPosition)
                context.add(symbol1BaseQty, symbol1EntryPrice, symbol2BaseQty, symbol2EntryPrice);
            else if(isRemoveFromPosition)
                context.remove(symbol1BaseQty, symbol1EntryPrice, symbol2BaseQty, symbol2EntryPrice);

            return;
        }

        const dbPosition = new Position({
            ...params,
            lastPnl: "0",
            open: true,
        });

        await dbPosition.save();

        const key = `${params.ownerId}-${dbPosition.symbol1}-${dbPosition.symbol2}`;
        const positionContext = new PositionContext(dbPosition, this.restClient, this.wsClient, this.residualFeedProvider, this.tickerFeedProvider);
        this.positionContexts.set(key, positionContext);
        positionContext.once("closed", this.positionExecuted.bind(this, params.ownerId, dbPosition, positionContext));
    }

    public async liquidateAll()
    {
        for(const context of this.positionContexts.values())
            await context.liquidate();
    }

    public async shutdown()
    {
        for(const context of this.positionContexts.values())
            await context.shutdown();
    }

    public get PositionContexts()
    {
        return this.positionContexts;
    }

    private async initialize()
    {
        const dbPositions = await Position.find({ ownerId: this.userId, open: true });

        for(const dbPosition of dbPositions)
        {
            const key = `${dbPosition.ownerId}-${dbPosition.symbol1}-${dbPosition.symbol2}`;
            this.positionContexts.set(key, new PositionContext(dbPosition, this.restClient, this.wsClient, this.residualFeedProvider, this.tickerFeedProvider));
        }
    }

    private positionExecuted(ownerId: string, dbPosition: Position, positionContext: PositionContext)
    {
        const key = `${ownerId}-${dbPosition.symbol1}-${dbPosition.symbol2}`;
        positionContext.shutdown();
        this.positionContexts.delete(key);
    }
}
