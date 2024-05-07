import { RestClientV5, WebsocketClient } from "bybit-api";
import Decimal from "decimal.js";
import { PnlCalculator } from "./PnlCalculator.js";
import { PositionContext } from "./PositionContext.js";
import { Position, PositionSide } from "../models/Position.js";

export interface AddToPositionParams
{
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

    private restClient: RestClientV5;
    private wsClient: WebsocketClient;
    private pnlCalculator: PnlCalculator;

    constructor(restClient: RestClientV5, wsClient: WebsocketClient, pnlCalculator: PnlCalculator)
    {
        this.positionContexts = new Map();
        this.restClient = restClient;
        this.wsClient = wsClient;
        this.pnlCalculator = pnlCalculator;

        this.initPromise = this.initialize();
    }

    public async submitToPosition(params: AddToPositionParams)
    {
        const symbol1BaseQty = new Decimal(params.symbol1BaseQty);
        const symbol2BaseQty = new Decimal(params.symbol2BaseQty);

        const symbol1EntryPrice = new Decimal(params.symbol1EntryPrice);
        const symbol2EntryPrice = new Decimal(params.symbol2EntryPrice);

        const contextKey = `${params.symbol1}-${params.symbol2}`;
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
            open: true,
        });

        await dbPosition.save();

        const key = `${dbPosition.symbol1}-${dbPosition.symbol2}`;
        this.positionContexts.set(key, new PositionContext(dbPosition, this.restClient, this.wsClient, this.pnlCalculator));
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
        const dbPositions = await Position.find();

        for(const dbPosition of dbPositions)
        {
            const key = `${dbPosition.symbol1}-${dbPosition.symbol2}`;
            this.positionContexts.set(key, new PositionContext(dbPosition, this.restClient, this.wsClient, this.pnlCalculator));
        }
    }
}
