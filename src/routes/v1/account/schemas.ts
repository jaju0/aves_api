import Joi from "joi";
import { CredentialsResponse } from "./controllers.js";

export const credentialSchema = Joi.object({
    key: Joi.string().required(),
    secret: Joi.string().required(),
    demoTrading: Joi.boolean().required(),
});

export const submitCredentials = Joi.alternatives<CredentialsResponse>().try(
    Joi.object({
        credentials: Joi.array().items(credentialSchema).required(),
        active_credential: credentialSchema.required(),
    }),
    Joi.object({
        credentials: Joi.array().items(credentialSchema).required(),
        active_credential: credentialSchema.optional(),
    }),
    Joi.object({
        credentials: Joi.array().items(credentialSchema).optional(),
        active_credential: credentialSchema.required(),
    })
);

export default {
    "/account/credentials": submitCredentials,
} as { [key: string]: Joi.ObjectSchema | Joi.AlternativesSchema };