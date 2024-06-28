import Decimal from "decimal.js";
import { PositionState } from "./PositionState.js";
import { PositionContext } from "./PositionContext.js";
import { PositionStatePending } from "./PositionStatePending.js";
import { PositionSide } from "../models/Position.js";

export class PositionStateClosed extends PositionState
{
    constructor(context: PositionContext)
    {
        super(context);
    }

    public async initialize()
    {
        this.context.position.open = false;
        await this.context.position.save();
        await this.context.shutdown();
        this.context.emit("closed");
    }

    public async residualUpdate(residual: Decimal)
    {
    }

    public async pnlUpdate(pnl: Decimal)
    {
    }

    public async add(symbol1BaseQty: Decimal, symbol1EntryPrice: Decimal, symbol2BaseQty: Decimal, symbol2EntryPrice: Decimal)
    {
    }

    public async remove(symbol1BaseQty: Decimal, symbol1EntryPrice: Decimal, symbol2BaseQty: Decimal, symbol2EntryPrice: Decimal)
    {
    }

    public async liquidate()
    {
        
    }
}