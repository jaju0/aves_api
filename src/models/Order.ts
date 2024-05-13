import mongoose, { Model } from "mongoose";
import PubSub from "pubsub-js";
import { orderModelToEventData } from "../utils/events.js";

export const orderType = ["Market", "Limit", "Stop"] as const;
export type OrderType = typeof orderType[number];

export const orderSide = ["Buy", "Sell"] as const;
export type OrderSide = typeof orderSide[number];

export const orderStatus = ["New", "Pending", "Execute", "Executed", "Failed"] as const;
export type OrderStatus = typeof orderStatus[number];

export interface IOrder extends mongoose.Document
{
    ownerId: string;
    status: OrderStatus;
    type: OrderType;
    side: OrderSide;
    symbol1: string;
    symbol2: string;
    symbol1BaseQty: string;
    symbol2BaseQty: string;
    quoteQty?: string;
    entryResidual?: string;
    regressionSlope: string;
    takeProfit?: string;
    stopLoss?: string;
}

type OrderModel = Model<IOrder>;

const orderSchema = new mongoose.Schema<IOrder, OrderModel>({
    ownerId: { type: String, required: true },
    status: { type: String, required: true, default: "New" },
    type: { type: String, required: true },
    side: { type: String, required: true },
    symbol1: { type: String, required: true },
    symbol2: { type: String, required: true },
    symbol1BaseQty: { type: String, required: true, default: "0" },
    symbol2BaseQty: { type: String, required: true, default: "0" },
    quoteQty: { type: String, required: false },
    entryResidual: { type: String, required: false },
    regressionSlope: { type: String, required: true },
    takeProfit: { type: String, required: false },
    stopLoss: { type: String, required: false },
});

orderSchema.post("save", doc => {
    PubSub.publish(`order.${doc.ownerId}`, orderModelToEventData(doc));
});

export const Order = mongoose.model("Order", orderSchema);
export type Order = InstanceType<typeof Order>;
