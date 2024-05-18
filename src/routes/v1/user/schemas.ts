import Joi from "joi";
import { userRank } from "../../../models/User.js";

export const createUser = Joi.object({
    email: Joi.string().required(),
    rank: Joi.string().valid(...userRank).required(),
});

export const amendUser = Joi.object({
    email: Joi.string().required(),
    rank: Joi.string().valid(...userRank).required(),
});

export default {
    "/user/create": createUser,
    "/user/amend": amendUser,
} as { [key: string]: Joi.ObjectSchema };