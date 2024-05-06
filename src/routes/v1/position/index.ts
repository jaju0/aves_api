import express from "express";
import passport from "passport";
import { PositionCoordinatorProvider } from "../../../core/PositionCoordinatorProvider.js";
import { getPositionListHandler } from "./controllers.js";

export function positionRouter(positionCoordinatorProvider: PositionCoordinatorProvider)
{
    const router = express.Router();

    router.use(passport.initialize());

    router.get("/list", passport.authenticate("jwt", { session: false }), getPositionListHandler.bind(undefined, positionCoordinatorProvider));

    return router;
}