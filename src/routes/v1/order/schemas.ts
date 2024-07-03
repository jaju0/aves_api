import Joi from "joi";
import { orderSide, orderType } from "../../../models/Order.js";

export const baseQtySchema = Joi.object({
    symbol1BaseQty: Joi.number().required(),
    symbol2BaseQty: Joi.number().required(),
});

export const submitOrder = Joi.object({
    type: Joi.string().valid(...orderType).required(),
    side: Joi.string().valid(...orderSide).required(),
    symbol1: Joi.string().required(),
    symbol2: Joi.string().required(),
    regressionSlope: Joi.number().required(),
    symbol1EntryPrice: Joi.number().optional(), // TODO: required if type if Limit or Stop
    symbol2EntryPrice: Joi.number().optional(), // TODO: required if type if Limit or Stop
    takeProfit: Joi.number().optional(),
    stopLoss: Joi.number().optional(),
    quoteQty: Joi.number().optional(), // TODO: this must exist if baseQty is undefined
    baseQty: baseQtySchema.optional(), // TODO: this must exist if quoteQty is undefined
});

export const amendOrder = Joi.object({
    orderId: Joi.string().required(),
    symbol1EntryPrice: Joi.number().optional(), // TODO: this must exist if symbol2EntryPrice is defined
    symbol2EntryPrice: Joi.number().optional(), // TODO: this must exist if symbol1EntryPrice is defined
    takeProfit: [Joi.number().optional(), Joi.allow(null)],
    stopLoss: [Joi.number().optional(), Joi.allow(null)],
});

export const cancelOrder = Joi.object({
    orderId: Joi.string().required(),
});

export default {
    "/order/submit": submitOrder,
    "/order/amend": amendOrder,
    "/order/cancel": cancelOrder,
} as { [key: string]: Joi.ObjectSchema };