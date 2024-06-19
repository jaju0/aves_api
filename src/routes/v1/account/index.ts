import express from "express";
import passport from "passport";
import { credentialsFetchingHandler, credentialsSubmitionHandler, credentialsActivationHandler, credentialsDeletionHandler, userDataFetchingHandler } from "./controllers.js";
import { schemaValidator } from "../schemaValidator.js";

export function accountRouter()
{
    const router = express.Router();

    router.use(passport.initialize());

    router.post("/credentials", schemaValidator("/account/credentials"), credentialsSubmitionHandler);
    router.put("/credentials/activate", schemaValidator("/account/credentials/activate"), credentialsActivationHandler);
    router.post("/credentials/delete", schemaValidator("/account/credentials/delete"), credentialsDeletionHandler);
    router.get("/credentials", credentialsFetchingHandler);
    router.get("/user-data", userDataFetchingHandler);

    return router;
}