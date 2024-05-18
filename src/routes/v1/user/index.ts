import express from "express";
import passport from "passport";
import { schemaValidator } from "../schemaValidator.js";
import { amendUserHandler, createUserHandler, getUserListHandler } from "./controllers.js";

export function userRouter()
{
    const router = express.Router();

    router.use(passport.initialize());

    router.post("/create", schemaValidator("/user/create"), passport.authenticate("jwt-bearer", { session: false }), createUserHandler);
    router.put("/amend", schemaValidator("/user/amend"), passport.authenticate("jwt-bearer", { session: false }), amendUserHandler);
    router.get("/list", passport.authenticate("jwt-bearer", { session: false }), getUserListHandler);

    return router;
}