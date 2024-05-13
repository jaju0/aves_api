import { NextFunction, Request } from "express";
import { WebSocket } from "ws";
import { Credential } from "../../../models/Credential.js";
import { WebsocketAgentProvider } from "../../../core/WebsocketAgentProvider.js";
import { websocketAuthenticate } from "../../../middleware/websocketAuthenticate.js";

export async function websocketHandler(websocketAgentProvider: WebsocketAgentProvider, ws: WebSocket, req: Request, next: NextFunction)
{
    await websocketAuthenticate("jwt-query", { session: false }, ws, req, next);

    if(req.user === undefined)
    {
        ws.close(1008);
        return;
    }

    const activeCredential = await Credential.getActiveCredential(req.user.id);
    if(activeCredential === "error")
    {
        ws.close(1008);
        return;
    }
    else if(activeCredential == undefined)
    {
        ws.close(1008);
        return;
    }

    websocketAgentProvider.createAgent(ws, req.user);
}