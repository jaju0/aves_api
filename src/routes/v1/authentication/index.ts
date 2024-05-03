import express from "express";
import passport from "passport";
import { googleCallbackHandler } from "./controllers.js";

export function authenticationRouter()
{
    const router = express.Router();

    router.use(passport.initialize());
    router.use(passport.session());

    router.get("/google/callback", passport.authenticate("google", { session: false, scope: ["email"] }), googleCallbackHandler);

    return router;
}
