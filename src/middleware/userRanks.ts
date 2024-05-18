import { NextFunction, Request, Response } from "express";

export function adminRank(req: Request, res: Response, next: NextFunction)
{
    if(req.user === undefined)
        return res.sendStatus(401);

    if(req.user.user_rank !== "ADMIN")
        return res.sendStatus(403);

    return next();
}

export function userRank(req: Request, res: Response, next: NextFunction)
{
    if(req.user === undefined)
        return res.sendStatus(401);

    if(
        req.user.user_rank !== "ADMIN" &&
        req.user.user_rank !== "USER"
    )
        return res.sendStatus(403);

    return next();
}