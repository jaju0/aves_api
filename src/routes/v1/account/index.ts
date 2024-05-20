import express from "express";
import passport from "passport";
import { credentialsFetchingHandler, credentialsSubmitionHandler, userDataFetchingHandler } from "./controllers.js";
import { schemaValidator } from "../schemaValidator.js";

export function accountRouter()
{
    const router = express.Router();

    router.use(passport.initialize());

    router.post("/credentials", schemaValidator("/account/credentials"), credentialsSubmitionHandler);
    router.get("/credentials", credentialsFetchingHandler);
    router.get("/user-data", userDataFetchingHandler);

    return router;
}