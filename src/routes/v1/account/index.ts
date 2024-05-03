import express from "express";
import passport from "passport";
import { credentialsFetchingHandler, credentialsSubmitionHandler, userDataFetchingHandler } from "./controllers.js";
import { schemaValidator } from "../schemaValidator.js";

export function accountRouter()
{
    const router = express.Router();

    router.use(passport.initialize());

    router.post("/credentials", schemaValidator("/account/credentials"), passport.authenticate("jwt", { session: false }), credentialsSubmitionHandler);
    router.get("/credentials", passport.authenticate("jwt", { session: false }), credentialsFetchingHandler);
    router.get("/user-data", passport.authenticate("jwt", { session: false }), userDataFetchingHandler);

    return router;
}