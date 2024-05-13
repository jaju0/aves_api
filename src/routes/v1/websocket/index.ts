import express from "express";
import { websocketHandler } from "./controllers.js";
import { WebsocketAgentProvider } from "../../../core/WebsocketAgentProvider.js";
import { websocketAuthenticate } from "../../../middleware/websocketAuthenticate.js";

export function websocketRouter(websocketAgentProvider: WebsocketAgentProvider)
{
    const router = express.Router();

    router.ws("/", websocketHandler.bind(undefined, websocketAgentProvider));

    return router;
}