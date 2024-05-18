import express from "express";
import { adminRank, userRank } from "../../middleware/userRanks.js";
import { authenticationRouter } from "./authentication/index.js";
import { accountRouter } from "./account/index.js";
import { orderRouter } from "./order/index.js";
import { positionRouter } from "./position/index.js";
import { websocketRouter } from "./websocket/index.js";
import { userRouter } from "./user/index.js";
import { OrderCoordinatorProvider } from "../../core/OrderCoordinatorProvider.js";
import { PositionCoordinatorProvider } from "../../core/PositionCoordinatorProvider.js";
import { WebsocketAgentProvider } from "../../core/WebsocketAgentProvider.js";

export function v1Router(orderCoordinatorProvider: OrderCoordinatorProvider, positionCoordinatorProvider: PositionCoordinatorProvider, websocketAgentProvider: WebsocketAgentProvider)
{
    const router = express.Router();

    router.use("/auth", userRank, authenticationRouter());
    router.use("/account", userRank, accountRouter());
    router.use("/order", userRank, orderRouter(orderCoordinatorProvider));
    router.use("/position", userRank, positionRouter(positionCoordinatorProvider));
    router.use("/ws", userRank, websocketRouter(websocketAgentProvider));
    router.use("/user", adminRank, userRouter());

    return router;
}