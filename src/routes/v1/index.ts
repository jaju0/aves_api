import express from "express";
import passport from "passport";
import { adminRank, userRank } from "../../middleware/userRanks.js";
import { authenticationRouter } from "./authentication/index.js";
import { accountRouter } from "./account/index.js";
import { orderRouter } from "./order/index.js";
import { positionRouter } from "./position/index.js";
import { userRouter } from "./user/index.js";
import { pairFinderRouter } from "./pair-finder/index.js";
import { websocketRouter } from "./websocket/index.js";
import { OrderCoordinatorProvider } from "../../core/OrderCoordinatorProvider.js";
import { PositionCoordinatorProvider } from "../../core/PositionCoordinatorProvider.js";
import { WebsocketAgentProvider } from "../../core/WebsocketAgentProvider.js";

export function v1Router(orderCoordinatorProvider: OrderCoordinatorProvider, positionCoordinatorProvider: PositionCoordinatorProvider, websocketAgentProvider: WebsocketAgentProvider)
{
    const router = express.Router();

    router.use("/auth", authenticationRouter());
    router.use("/account", passport.authenticate("jwt-bearer", { session: false }), userRank, accountRouter());
    router.use("/order", passport.authenticate("jwt-bearer", { session: false }), userRank, orderRouter(orderCoordinatorProvider));
    router.use("/position", passport.authenticate("jwt-bearer", { session: false }), userRank, positionRouter(positionCoordinatorProvider));
    router.use("/user", passport.authenticate("jwt-bearer", { session: false }), adminRank, userRouter());
    router.use("/pair-finder", passport.authenticate("jwt-bearer", { session: false }), userRank, pairFinderRouter());
    router.use("/ws", websocketRouter(websocketAgentProvider));

    return router;
}