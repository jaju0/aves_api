import mongoose, { Model } from "mongoose";
import PubSub from "pubsub-js";
import { orderModelToEventData } from "../utils/events.js";
import config from "../config.js";

export const orderType = ["Market", "Limit", "Stop"] as const;
export type OrderType = typeof orderType[number];

export const orderSide = ["Buy", "Sell"] as const;
export type OrderSide = typeof orderSide[number];

export const orderStatus = ["New", "Pending", "Execute", "Executed", "Failed"] as const;
export type OrderStatus = typeof orderStatus[number];

export interface IOrder extends mongoose.Document
{
    created_at: Date;
    new_status_expiration_date: Date | null;
    failed_status_expiration_date: Date | null;
    executing_status_expiration_date: Date | null;
    executed_status_expiration_date: Date | null;
    ownerId: string;
    status: OrderStatus;
    type: OrderType;
    side: OrderSide;
    symbol1: string;
    symbol2: string;
    symbol1BaseQty: string;
    symbol2BaseQty: string;
    quoteQty?: string;
    symbol1EntryPrice?: string;
    symbol2EntryPrice?: string;
    regressionSlope: string;
    takeProfit?: string;
    stopLoss?: string;
}

type OrderModel = Model<IOrder>;

const orderSchema = new mongoose.Schema<IOrder, OrderModel>({
    created_at: { type: Date, default: Date.now },
    new_status_expiration_date: { type: Date, expires: +config.NEW_ORDER_EXPIRATION_TIME_HOURS * 60 * 60 * 1000, default: null },
    failed_status_expiration_date: { type: Date, expires: +config.FAILED_ORDER_EXPIRATION_TIME_HOURS * 60 * 60 * 1000, default: null },
    executing_status_expiration_date: { type: Date, expires: +config.EXECUTING_ORDER_EXPIRATION_TIME_HOURS * 60 * 60 * 1000, default: null },
    executed_status_expiration_date: { type: Date, expires: +config.EXECUTED_ORDER_EXPIRATION_TIME_HOURS * 60 * 60 * 1000, default: null },
    ownerId: { type: String, required: true },
    status: { type: String, required: true, default: "New" },
    type: { type: String, required: true },
    side: { type: String, required: true },
    symbol1: { type: String, required: true },
    symbol2: { type: String, required: true },
    symbol1BaseQty: { type: String, required: true, default: "0" },
    symbol2BaseQty: { type: String, required: true, default: "0" },
    quoteQty: { type: String, required: false },
    symbol1EntryPrice: { type: String, required: false },
    symbol2EntryPrice: { type: String, required: false },
    regressionSlope: { type: String, required: true },
    takeProfit: { type: String, required: false },
    stopLoss: { type: String, required: false },
});

orderSchema.post("save", doc => {
    PubSub.publish(`order.${doc.ownerId}`, orderModelToEventData(doc));
});

export const Order = mongoose.model("Order", orderSchema);
export type Order = InstanceType<typeof Order>;
