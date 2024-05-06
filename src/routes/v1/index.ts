import express from "express";
import { authenticationRouter } from "./authentication/index.js";
import { accountRouter } from "./account/index.js";
import { orderRouter } from "./order/index.js";
import { positionRouter } from "./position/index.js";
import { OrderCoordinatorProvider } from "../../core/OrderCoordinatorProvider.js";
import { PositionCoordinatorProvider } from "../../core/PositionCoordinatorProvider.js";

export function v1Router(orderCoordinatorProvider: OrderCoordinatorProvider, positionCoordinatorProvider: PositionCoordinatorProvider)
{
    const router = express.Router();

    router.use("/auth", authenticationRouter());
    router.use("/account", accountRouter());
    router.use("/order", orderRouter(orderCoordinatorProvider));
    router.use("/position", positionRouter(positionCoordinatorProvider));

    return router;
}