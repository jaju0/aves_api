import Joi from "joi";

export const liquidatePosition = Joi.object({
    symbol1: Joi.string().required(),
    symbol2: Joi.string().required(),
});

export const amendPosition = Joi.object({
    symbol1: Joi.string().required(),
    symbol2: Joi.string().required(),
    takeProfit: Joi.string().allow(null).optional(),
    stopLoss: Joi.string().allow(null).optional(),
});

export default {
    "/position/liquidate": liquidatePosition,
    "/position/amend": amendPosition,
} as { [key: string]: Joi.ObjectSchema };