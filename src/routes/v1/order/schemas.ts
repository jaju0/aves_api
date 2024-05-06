import Joi from "joi";
import { orderSide, orderType } from "../../../models/Order.js";

export const baseQtySchema = Joi.object({
    symbol1BaseQty: Joi.string().required(),
    symbol2BaseQty: Joi.string().required(),
});

export const submitOrder = Joi.object({
    type: Joi.string().valid(...orderType).required(),
    side: Joi.string().valid(...orderSide).required(),
    symbol1: Joi.string().required(),
    symbol2: Joi.string().required(),
    regressionSlope: Joi.number().required(),
    entryResidual: Joi.number().optional(), // TODO: required if type if Limit or Stop
    takeProfit: Joi.number().optional(),
    stopLoss: Joi.number().optional(),
    quoteQty: Joi.number().optional(), // TODO: this must exist if baseQty is undefined
    baseQty: Joi.number().optional(), // TODO: this must exist if quoteQty is undefined
});

export const amendOrder = Joi.object({
    orderId: Joi.string().required(),
    entryResidual: Joi.number().required(),
})

export default {
    "/order/submit": submitOrder,
    "/order/amend": amendOrder,
} as { [key: string]: Joi.ObjectSchema };