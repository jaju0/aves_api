import express from "express";
import passport from "passport";
import { getPairsHandler, pairFinderStatusHandler, startPairFinderHandler, stopPairFinderHandler } from "./controllers.js";

export function pairFinderRouter()
{
    const router = express.Router();

    router.use(passport.initialize());

    router.get("/pairs", getPairsHandler);
    router.get("/status", pairFinderStatusHandler);
    router.post("/start", startPairFinderHandler);
    router.post("/stop", stopPairFinderHandler);

    return router;
}