import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import config from "../../../config.js";

export interface SuccessfulLoginResponse
{
    accessToken: string;
    expirationTimestamp: number;
}

export function googleCallbackHandler(req: Request, res: Response<SuccessfulLoginResponse>)
{
    if(req.user === undefined)
        return res.sendStatus(401);

    const expirationTimestamp = Date.now()+config.JSON_WEB_TOKEN_EXPIRES_IN*1000;
    const accessToken = jwt.sign({ user_id: req.user.id }, config.JSON_WEB_TOKEN_SECRET, { expiresIn: config.JSON_WEB_TOKEN_EXPIRES_IN });
    const refreshToken = jwt.sign({ user_id: req.user.id }, config.JSON_WEB_TOKEN_REFRESH_SECRET, { expiresIn: config.JSON_WEB_TOKEN_REFRESH_EXPIRES_IN });

    res.cookie("jwt", refreshToken, {
        httpOnly: true,
        sameSite: "none",
        secure: true,
        maxAge: config.JSON_WEB_TOKEN_REFRESH_EXPIRES_IN * 1000,
    });

    return res.send({ accessToken, expirationTimestamp });
}

export function refreshHandler(req: Request, res: Response<SuccessfulLoginResponse>)
{
    if(!req.cookies?.jwt)
        return res.sendStatus(401);

    const refreshToken = req.cookies.jwt;

    jwt.verify(refreshToken, config.JSON_WEB_TOKEN_REFRESH_SECRET, (error: jwt.VerifyErrors | null, decoded: string | jwt.JwtPayload | undefined) => {
        if(error || typeof decoded !== "object" || decoded.user_id === undefined)
            return res.sendStatus(401);

        const expirationTimestamp = Date.now()+config.JSON_WEB_TOKEN_EXPIRES_IN*1000;
        const accessToken = jwt.sign({ user_id: decoded.user_id }, config.JSON_WEB_TOKEN_SECRET, { expiresIn: config.JSON_WEB_TOKEN_EXPIRES_IN });
        return res.send({ accessToken, expirationTimestamp });
    });
}

export function logoutHandler(req: Request, res: Response)
{
    if(!req.cookies?.jwt)
        return res.sendStatus(401);

    res.clearCookie("jwt", {
        httpOnly: true,
        sameSite: "none",
        secure: true,
        maxAge: config.JSON_WEB_TOKEN_REFRESH_EXPIRES_IN * 1000,
    });

    return res.sendStatus(200);
}