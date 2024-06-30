import EventEmitter from "events";
import { RestClientV5, WebsocketClient } from "bybit-api";
import Decimal from "decimal.js";
import { Position } from "../models/Position.js";
import { PositionState } from "./PositionState.js";
import { PositionStatePending } from "./PositionStatePending.js";
import { PositionStateClosed } from "./PositionStateClosed.js";
import { ResidualFeedProvider } from "./ResidualFeedProvider.js";
import { TickerFeedProvider } from "./TickerFeedProvider.js";
import { ResidualFeed } from "./ResidualFeed.js";
import { PnlFeed } from "./PnlFeed.js";
import { TickerFeed } from "./TickerFeed.js";

export class PositionContext extends EventEmitter<{
    "closed": [],
}>
{
    public readonly position: Position;
    public readonly restClient: RestClientV5;
    public readonly wsClient: WebsocketClient;
    public readonly residualFeedProvider: ResidualFeedProvider;
    public readonly tickerFeedProvider: TickerFeedProvider;
    public residualFeed?: ResidualFeed;
    public symbol1TickerFeed?: TickerFeed;
    public symbol2TickerFeed?: TickerFeed;
    public pnlFeed?: PnlFeed;

    private state: PositionState;

    constructor(position: Position, restClient: RestClientV5, wsClient: WebsocketClient, residualFeedProvider: ResidualFeedProvider, tickerFeedProvider: TickerFeedProvider)
    {
        super();
        this.position = position;
        this.restClient = restClient;
        this.wsClient = wsClient;
        this.residualFeedProvider = residualFeedProvider;
        this.tickerFeedProvider = tickerFeedProvider;

        if(this.position.open)
            this.state = new PositionStatePending(this);
        else
            this.state = new PositionStateClosed(this);
    }

    public async shutdown()
    {
        this.pnlFeed?.off("update", this.pnlUpdate.bind(this));
        this.pnlFeed?.shutdown();
        this.pnlFeed = undefined;

        if(this.symbol1TickerFeed)
        {
            this.tickerFeedProvider.remove(this.symbol1TickerFeed);
        this.symbol1TickerFeed = undefined;
        }

        if(this.symbol2TickerFeed)
        {
            this.tickerFeedProvider.remove(this.symbol2TickerFeed);
            this.symbol2TickerFeed = undefined;
        }

        if(this.residualFeed)
        {
            this.residualFeed.off("update", this.residualUpdate.bind(this));
            this.residualFeedProvider.remove(this.residualFeed);
        this.residualFeed = undefined;
        }
    }

    public async amendExitOrders(exitOrders: { takeProfit?: string | null, stopLoss?: string | null })
    {
        if(exitOrders.takeProfit !== undefined)
        {
            if(exitOrders.takeProfit === null)
                this.position.takeProfit = undefined;
            else
                this.position.takeProfit = exitOrders.takeProfit;
        }
        if(exitOrders.stopLoss !== undefined)
        {
            if(exitOrders.stopLoss === null)
                this.position.stopLoss = undefined;
            else
                this.position.stopLoss = exitOrders.stopLoss;
        }

        await this.position.save();
    }

    public async transitionTo(state: PositionState)
    {
        this.state = state;
        await this.state.initialize();
    }

    public async residualUpdate(residual: Decimal)
    {
        return await this.state.residualUpdate(residual);
    }

    public async pnlUpdate(pnl: Decimal)
    {
        return await this.state.pnlUpdate(pnl);
    }

    public async add(symbol1BaseQty: Decimal, symbol1EntryPrice: Decimal, symbol2BaseQty: Decimal, symbol2EntryPrice: Decimal)
    {
        return await this.state.add(symbol1BaseQty, symbol2BaseQty, symbol1EntryPrice, symbol2EntryPrice);
    }

    public async remove(symbol1BaseQty: Decimal, symbol1EntryPrice: Decimal, symbol2BaseQty: Decimal, symbol2EntryPrice: Decimal)
    {
        return await this.state.remove(symbol1BaseQty, symbol1EntryPrice, symbol2BaseQty, symbol2EntryPrice);
    }

    public async liquidate()
    {
        return await this.state.liquidate();
    }
}