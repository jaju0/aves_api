import Joi from "joi";

export const liquidatePosition = Joi.object({
    symbol1: Joi.string().required(),
    symbol2: Joi.string().required(),
});

export default {
    "/position/liquidate": liquidatePosition,
} as { [key: string]: Joi.ObjectSchema };