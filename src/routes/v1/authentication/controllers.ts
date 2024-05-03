import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import config from "../../../config.js";

export interface SuccessfulLoginResponse
{
    token: string;
}

export function googleCallbackHandler(req: Request, res: Response<SuccessfulLoginResponse>)
{
    if(req.user === undefined)
        return res.sendStatus(401);

    const token = jwt.sign({ google_id: req.user.google_id }, config.JSON_WEB_TOKEN_SECRET, { expiresIn: config.JSON_WEB_TOKEN_EXPIRES_IN });
    return res.send({ token });
}