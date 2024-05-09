import mongoose, { Model } from "mongoose";

export const orderType = ["Market", "Limit", "Stop"] as const;
export type OrderType = typeof orderType[number];

export const orderSide = ["Buy", "Sell"] as const;
export type OrderSide = typeof orderSide[number];

export interface IOrder extends mongoose.Document
{
    ownerId: string;
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
    executed: boolean;
    failed: boolean;
}

type OrderModel = Model<IOrder>;

const orderSchema = new mongoose.Schema<IOrder, OrderModel>({
    ownerId: { type: String, required: true },
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
    executed: { type: Boolean, required: true, default: false },
    failed: { type: Boolean, required: true, default: false },
});

export const Order = mongoose.model("Order", orderSchema);
export type Order = InstanceType<typeof Order>;
