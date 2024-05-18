import express from "express";
import passport from "passport";
import cookieParser from "cookie-parser";
import { googleCallbackHandler, refreshHandler } from "./controllers.js";

export function authenticationRouter()
{
    const router = express.Router();

    router.use(passport.initialize());
    router.use(passport.session());
    router.use(cookieParser());

    router.get("/google/callback", passport.authenticate("google", { session: false, scope: ["email"] }), googleCallbackHandler);
    router.post("/refresh", refreshHandler);

    return router;
}
