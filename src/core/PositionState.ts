import Decimal from "decimal.js";
import { PositionContext } from "./PositionContext.js";

export abstract class PositionState
{
    protected context: PositionContext;

    constructor(context: PositionContext)
    {
        this.context = context;
    }

    public abstract initialize(): Promise<void>;
    public abstract residualUpdate(residual: Decimal): Promise<void>;
    public abstract pnlUpdate(pnl: Decimal): Promise<void>;
    public abstract add(symbol1BaseQty: Decimal, symbol1EntryPrice: Decimal, symbol2BaseQty: Decimal, symbol2EntryPrice: Decimal): Promise<void>;
    public abstract remove(symbol1BaseQty: Decimal, symbol1EntryPrice: Decimal, symbol2BaseQty: Decimal, symbol2EntryPrice: Decimal): Promise<void>;
    public abstract liquidate(): Promise<void>;
}