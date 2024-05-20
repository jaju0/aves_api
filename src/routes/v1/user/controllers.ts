import { Request, Response } from "express";
import { Credential } from "../../../models/Credential.js";
import { IUser, User, UserRank } from "../../../models/User.js";

export interface UserCreationRequest
{
    email: string;
    rank: UserRank;
}

export interface UserAmendmentRequest
{
    email: string;
    rank: UserRank;
}

export interface UserDeletionRequest
{
    email: string;
}

export async function createUserHandler(req: Request<any, any, UserCreationRequest>, res: Response<IUser>)
{
    if(req.user === undefined)
        return res.sendStatus(401);

    const activeCredential = await Credential.getActiveCredential(req.user.id);
    if(activeCredential === "error")
        return res.sendStatus(500);
    else if(activeCredential == undefined)
        return res.sendStatus(400);

    const data = req.body;

    const createdUser = await User.add(data.email, data.rank);
    if(createdUser === undefined)
        return res.sendStatus(409);

    return res.json(createdUser);
}

export async function amendUserHandler(req: Request<any, any, UserAmendmentRequest>, res: Response<IUser>)
{
    if(req.user === undefined)
        return res.sendStatus(401);

    const activeCredential = await Credential.getActiveCredential(req.user.id);
    if(activeCredential === "error")
        return res.sendStatus(500);
    else if(activeCredential == undefined)
        return res.sendStatus(400);

    const data = req.body;

    const updatedUser = await User.update(data.email, data.rank);
    if(updatedUser === undefined)
        return res.sendStatus(404);

    return res.json(updatedUser);
}

export async function getUserListHandler(req: Request, res: Response<IUser[]>)
{
    if(req.user === undefined)
        return res.sendStatus(401);

    const activeCredential = await Credential.getActiveCredential(req.user.id);
    if(activeCredential === "error")
        return res.sendStatus(500);
    else if(activeCredential == undefined)
        return res.sendStatus(400);
    
    const users = await User.find();

    return res.json(users);
}

export async function deleteUserHandler(req: Request<any, any, UserDeletionRequest>, res: Response)
{
    if(req.user === undefined)
        return res.sendStatus(401);

    const activeCredential = await Credential.getActiveCredential(req.user.id);
    if(activeCredential === "error")
        return res.sendStatus(500);
    else if(activeCredential == undefined)
        return res.sendStatus(400);

    const data = req.body;

    const userCount = await User.find({ email: data.email }).countDocuments();
    if(!userCount)
        return res.sendStatus(404);

    const deleteResult = await User.deleteMany({ email: data.email });
    if(!deleteResult.acknowledged || !deleteResult.deletedCount)
        return res.sendStatus(500);

    return res.sendStatus(200);
}