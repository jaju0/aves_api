import { WebSocket } from "ws";
import { NextFunction, Request } from "express";
import passport from "passport";

export function websocketAuthenticate(strategy: string | passport.Strategy | string[], options: passport.AuthenticateOptions, ws: WebSocket, req: Request, next: NextFunction)
{
    return new Promise((resolve, reject) => {
        passport.authenticate(strategy, options, (err: any, user: any, info: any, status: any) => {
            if(err)
            {
                reject(err);
                return next(err);
            }
            if(!user)
            {
                reject(err);
                return ws.close(1008);
            }
            req.login(user, { session: false }, err => {
                if(err)
                {
                    reject();
                    return ws.close(1008);
                }

                resolve(req.user);
            });
        })(req, next);
    });
}