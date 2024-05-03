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

        this.context.position.updateOne({
            side: "None",
            open: false,
            symbol1BaseQty: "",
            symbol2BaseQty: "",
            symbol1EntryPrice: "",
            symbol2EntryPrice: "",
        });
    }

    public async initialize()
    {
    }

    public async residualUpdate(residual: Decimal)
    {
    }

    public async add(symbol1BaseQty: Decimal, symbol1EntryPrice: Decimal, symbol2BaseQty: Decimal, symbol2EntryPrice: Decimal)
    {
        await this.context.position.updateOne({
            symbol1BaseQty: symbol1BaseQty.toString(),
            symbol2BaseQty: symbol2BaseQty.toString(),
            symbol1EntryPrice: symbol1EntryPrice.toString(),
            symbol2EntryPrice: symbol2EntryPrice.toString(),
        });

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

        await this.context.position.updateOne({
            side: newPositionSide,
            symbol1BaseQty: symbol1BaseQty.toString(),
            symbol2BaseQty: symbol2BaseQty.toString(),
            symbol1EntryPrice: symbol1EntryPrice.toString(),
            symbol2EntryPrice: symbol2EntryPrice.toString(),
        });

        this.context.transitionTo(new PositionStatePending(this.context));
    }

    public async liquidate()
    {
        
    }
}