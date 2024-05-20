import express from "express";
import passport from "passport";
import { orderAmendmentHandler, orderListHandler, orderSubmitionHandler } from "./controllers.js";
import { OrderCoordinatorProvider } from "../../../core/OrderCoordinatorProvider.js";
import { schemaValidator } from "../schemaValidator.js";

export function orderRouter(orderCoordinatorProvider: OrderCoordinatorProvider)
{
    const router = express.Router();

    router.use(passport.initialize());

    router.post("/submit", schemaValidator("/order/submit"), orderSubmitionHandler.bind(undefined, orderCoordinatorProvider));
    router.post("/amend", schemaValidator("/order/amend"), orderAmendmentHandler.bind(undefined, orderCoordinatorProvider));
    router.get("/list", orderListHandler.bind(undefined, orderCoordinatorProvider));

    return router;
}