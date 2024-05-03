import express from "express";
import schemas from "./schemas.js";

interface ValidationError
{
    message: string;
    type: string;
}

interface JoiError
{
    status: string;
    error: {
        original: unknown;
        details: ValidationError[];
    };
}

interface CustomError
{
    status: string;
    error: string;
}

const supportedMethods = ["post", "put", "patch", "delete"];

const validationOptions = {
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: false,
};

export function schemaValidator(path: string, useJoiError = true): express.RequestHandler
{
    const schema = schemas[path];

    if(!schema)
        throw new Error(`schema not found for path ${path}`);

    return (req, res, next) => {
        const method = req.method.toLowerCase();

        if(!supportedMethods.includes(method))
            return next();

        const { error, value } = schema.validate(req.body, validationOptions);

        if(error && useJoiError)
        {
            const joiError: JoiError = {
                status: "failed",
                error: {
                    original: error._original,
                    details: error.details.map(({ message, type }: ValidationError) => ({
                        message: message.replace(/['"]/g, ""),
                        type,
                    })),
                }
            }

            return res.status(422).json(joiError);
        }
        else if(error)
        {
            const customError = <CustomError> {
                status: "failed",
                error: "Invalid Request",
            };

            return res.status(422).json(customError);
        }

        req.body = value;
        return next();
    }
}