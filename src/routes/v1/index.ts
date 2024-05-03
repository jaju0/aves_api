import express from "express";
import { authenticationRouter } from "./authentication/index.js";
import { accountRouter } from "./account/index.js";
import { orderRouter } from "./order/index.js";
import { OrderCoordinatorProvider } from "../../OrderCoordinatorProvider.js";

export function v1Router(orderCoordinatorProvider: OrderCoordinatorProvider)
{
    const router = express.Router();

    router.use("/auth", authenticationRouter());
    router.use("/account", accountRouter());
    router.use("/order", orderRouter(orderCoordinatorProvider));

    return router;
}