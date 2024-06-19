import Joi from "joi";

export const credentialSchema = Joi.object({
    key: Joi.string().required(),
    secret: Joi.string().required(),
    demoTrading: Joi.boolean().required(),
    isActive: Joi.boolean().required(),
});

export const submitCredentials = Joi.object({
    credentials: Joi.array().items(credentialSchema).required(),
});

export const activateCredential = Joi.object({
    key: Joi.string().required(),
});

export const deleteCredential = Joi.object({
    key: Joi.string().required(),
});

export default {
    "/account/credentials": submitCredentials,
    "/account/credentials/activate": activateCredential,
    "/account/credentials/delete": deleteCredential,
} as { [key: string]: Joi.ObjectSchema | Joi.AlternativesSchema };