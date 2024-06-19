import { NextFunction, Request } from "express";
import { WebSocket } from "ws";
import { Credential } from "../../../models/Credential.js";
import { WebsocketAgentProvider } from "../../../core/WebsocketAgentProvider.js";
import { websocketAuthenticate } from "../../../middleware/websocketAuthenticate.js";

export async function websocketHandler(websocketAgentProvider: WebsocketAgentProvider, ws: WebSocket, req: Request, next: NextFunction)
{
    try
    {
        await websocketAuthenticate("jwt-query", { session: false }, ws, req, next);
    }
    catch(error)
    {
        ws.close(1008);
        return;
    }

    if(req.user === undefined)
    {
        ws.close(1008);
        return;
    }

    websocketAgentProvider.createAgent(ws, req.user);
}