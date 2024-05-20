import express from "express";
import passport from "passport";
import { schemaValidator } from "../schemaValidator.js";
import { amendUserHandler, createUserHandler, getUserListHandler, deleteUserHandler } from "./controllers.js";

export function userRouter()
{
    const router = express.Router();

    router.use(passport.initialize());

    router.post("/create", schemaValidator("/user/create"), createUserHandler);
    router.put("/amend", schemaValidator("/user/amend"), amendUserHandler);
    router.get("/list", getUserListHandler);
    router.delete("/delete", schemaValidator("/user/delete"), deleteUserHandler);

    return router;
}