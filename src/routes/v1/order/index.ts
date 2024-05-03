import express from "express";
import passport from "passport";
import { orderSubmitionHandler } from "./controllers.js";
import { OrderCoordinatorProvider } from "../../../core/OrderCoordinatorProvider.js";
import { schemaValidator } from "../schemaValidator.js";

export function orderRouter(orderCoordinatorProvider: OrderCoordinatorProvider)
{
    const router = express.Router();

    router.use(passport.initialize());

    router.use("/submit", schemaValidator("/order/submit"), passport.authenticate("jwt", { session: false }), orderSubmitionHandler.bind(undefined, orderCoordinatorProvider));

    return router;
}