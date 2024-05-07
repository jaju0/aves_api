import express from "express";
import passport from "passport";
import { PositionCoordinatorProvider } from "../../../core/PositionCoordinatorProvider.js";
import { getPositionListHandler, liquidationHandler } from "./controllers.js";
import { schemaValidator } from "../schemaValidator.js";

export function positionRouter(positionCoordinatorProvider: PositionCoordinatorProvider)
{
    const router = express.Router();

    router.use(passport.initialize());

    router.get("/list", passport.authenticate("jwt", { session: false }), getPositionListHandler.bind(undefined, positionCoordinatorProvider));
    router.post("/liquidate", schemaValidator("/position/liquidate"), passport.authenticate("jwt", { session: false }), liquidationHandler.bind(undefined, positionCoordinatorProvider));

    return router;
}