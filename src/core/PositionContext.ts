import EventEmitter from "events";
import { RestClientV5, WebsocketClient } from "bybit-api";
import Decimal from "decimal.js";
import { Position } from "../models/Position.js";
import { PositionState } from "./PositionState.js";
import { PositionStatePending } from "./PositionStatePending.js";
import { PositionStateClosed } from "./PositionStateClosed.js";
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
    public residualFeed?: ResidualFeed;
    public symbol1TickerFeed?: TickerFeed;
    public symbol2TickerFeed?: TickerFeed;
    public pnlFeed?: PnlFeed;

    private state: PositionState;

    constructor(position: Position, restClient: RestClientV5, wsClient: WebsocketClient)
    {
        super();
        this.position = position;
        this.restClient = restClient;
        this.wsClient = wsClient;

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

        this.symbol1TickerFeed?.shutdown();
        this.symbol1TickerFeed = undefined;

        this.symbol2TickerFeed?.shutdown(),
        this.symbol1TickerFeed = undefined;

        this.residualFeed?.off("update", this.residualUpdate.bind(this));
        this.residualFeed?.shutdown();
        this.residualFeed = undefined;
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