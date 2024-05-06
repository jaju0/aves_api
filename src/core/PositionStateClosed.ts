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

        this.context.position.side = "None";
        this.context.position.open = false;
        this.context.position.symbol1BaseQty  = "";
        this.context.position.symbol2BaseQty = "";
        this.context.position.symbol1EntryPrice = "";
        this.context.position.symbol2EntryPrice = "";
        this.context.position.save();
    }

    public async initialize()
    {
    }

    public async residualUpdate(residual: Decimal)
    {
    }

    public async add(symbol1BaseQty: Decimal, symbol1EntryPrice: Decimal, symbol2BaseQty: Decimal, symbol2EntryPrice: Decimal)
    {
        this.context.position.symbol1BaseQty = symbol1BaseQty.toString();
        this.context.position.symbol2BaseQty = symbol2BaseQty.toString();
        this.context.position.symbol1EntryPrice = symbol1EntryPrice.toString();
        this.context.position.symbol2EntryPrice = symbol2EntryPrice.toString();
        await this.context.position.save();

        this.context.transitionTo(new PositionStatePending(this.context));
    }

    public async remove(symbol1BaseQty: Decimal, symbol1EntryPrice: Decimal, symbol2BaseQty: Decimal, symbol2EntryPrice: Decimal)
    {
        let newPositionSide: PositionSide;
        if(this.context.position.side === "Long")
            newPositionSide = "Short";
        else if(this.context.position.side === "Short")
            newPositionSide = "Long";
        else
            return;

        this.context.position.side = newPositionSide;
        this.context.position.symbol1BaseQty = symbol1BaseQty.toString();
        this.context.position.symbol2BaseQty = symbol2BaseQty.toString();
        this.context.position.symbol1EntryPrice = symbol1EntryPrice.toString();
        this.context.position.symbol2EntryPrice = symbol2EntryPrice.toString();
        await this.context.position.save();

        this.context.transitionTo(new PositionStatePending(this.context));
    }

    public async liquidate()
    {
        
    }
}