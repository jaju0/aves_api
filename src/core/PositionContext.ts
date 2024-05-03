import { RestClientV5, WebsocketClient } from "bybit-api";
import Decimal from "decimal.js";
import { Position } from "../models/Position.js";
import { PositionState } from "./PositionState.js";
import { PositionStatePending } from "./PositionStatePending.js";
import { PositionStateClosed } from "./PositionStateClosed.js";
import { PnlCalculator } from "./PnlCalculator.js";
import { ResidualFeed } from "./ResidualFeed.js";

export class PositionContext
{
    public readonly position: Position;
    public readonly restClient: RestClientV5;
    public readonly wsClient: WebsocketClient;
    public readonly pnlCalculator: PnlCalculator;
    public residualFeed?: ResidualFeed;

    public pnl: Decimal;

    private state: PositionState;

    constructor(position: Position, restClient: RestClientV5, wsClient: WebsocketClient, pnlCalculator: PnlCalculator)
    {
        this.position = position;
        this.restClient = restClient;
        this.wsClient = wsClient;
        this.pnlCalculator = pnlCalculator;

        this.pnl = new Decimal(0);

        if(this.position.open)
            this.state = new PositionStatePending(this);
        else
            this.state = new PositionStateClosed(this);
    }

    public async shutdown()
    {
        this.residualFeed?.off("update", this.residualUpdate.bind(this));
        this.residualFeed?.shutdown();
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