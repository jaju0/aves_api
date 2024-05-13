import express from "express";
import { authenticationRouter } from "./authentication/index.js";
import { accountRouter } from "./account/index.js";
import { orderRouter } from "./order/index.js";
import { positionRouter } from "./position/index.js";
import { websocketRouter } from "./websocket/index.js";
import { OrderCoordinatorProvider } from "../../core/OrderCoordinatorProvider.js";
import { PositionCoordinatorProvider } from "../../core/PositionCoordinatorProvider.js";
import { WebsocketAgentProvider } from "../../core/WebsocketAgentProvider.js";

export function v1Router(orderCoordinatorProvider: OrderCoordinatorProvider, positionCoordinatorProvider: PositionCoordinatorProvider, websocketAgentProvider: WebsocketAgentProvider)
{
    const router = express.Router();

    router.use("/auth", authenticationRouter());
    router.use("/account", accountRouter());
    router.use("/order", orderRouter(orderCoordinatorProvider));
    router.use("/position", positionRouter(positionCoordinatorProvider));
    router.use("/ws", websocketRouter(websocketAgentProvider));

    return router;
}