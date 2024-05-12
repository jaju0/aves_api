import mongoose, { Model } from "mongoose";

export type PositionSide = "None" | "Long" | "Short";

export interface IPosition extends mongoose.Document
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
    open: boolean;
}

type PositionModel = Model<IPosition>;

const positionSchema = new mongoose.Schema<IPosition, PositionModel>({
    ownerId: { type: String, required: true },
    side: { type: String, required: true },
    symbol1: { type: String, required: true },
    symbol2: { type: String, required: true },
    symbol1EntryPrice: { type: String, required: true },
    symbol2EntryPrice: { type: String, required: true },
    symbol1BaseQty: { type: String, required: true },
    symbol2BaseQty: { type: String, required: true },
    regressionSlope: { type: String, required: true },
    takeProfit: { type: String, required: false },
    stopLoss: { type: String, required: false },
    open: { type: Boolean, required: true, default: true },
});

export const Position = mongoose.model("Position", positionSchema);
export type Position = InstanceType<typeof Position>;
