import mongoose, { Model } from "mongoose";
import PubSub from "pubsub-js";
import { positionModelToEventData } from "../utils/events.js";
import config from "../config.js";

export type PositionSide = "None" | "Long" | "Short";

export interface IPosition extends mongoose.Document
{
    created_at: Date;
    deletion_date: Date | null;
    ownerId: string;
    side: PositionSide;
    symbol1: string;
    symbol2: string;
    symbol1EntryPrice: string;
    symbol2EntryPrice: string;
    symbol1BaseQty: string;
    symbol2BaseQty: string;
    lastPnl: string;
    regressionSlope: string;
    takeProfit?: string;
    stopLoss?: string;
    open: boolean;
}

type PositionModel = Model<IPosition>;

const positionSchema = new mongoose.Schema<IPosition, PositionModel>({
    created_at: { type: Date, default: Date.now },
    deletion_date: { type: Date, expires: +config.CLOSED_POSITION_EXPIRATION_TIME_HOURS * 60 * 60 * 1000, default: null },
    ownerId: { type: String, required: true },
    side: { type: String, required: true },
    symbol1: { type: String, required: true },
    symbol2: { type: String, required: true },
    symbol1EntryPrice: { type: String, required: true },
    symbol2EntryPrice: { type: String, required: true },
    symbol1BaseQty: { type: String, required: true },
    symbol2BaseQty: { type: String, required: true },
    lastPnl: { type: String, required: true, default: "0" },
    regressionSlope: { type: String, required: true },
    takeProfit: { type: String, required: false },
    stopLoss: { type: String, required: false },
    open: { type: Boolean, required: true, default: true },
});

positionSchema.post("save", doc => {
    PubSub.publish(`position.${doc.ownerId}`, positionModelToEventData(doc));
});

export const Position = mongoose.model("Position", positionSchema);
export type Position = InstanceType<typeof Position>;
