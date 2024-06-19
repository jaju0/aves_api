import { Request, Response } from "express";
import { Credential } from "../../../models/Credential.js";
import { User, UserRank } from "../../../models/User.js";

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

export interface UserDataResponse
{
    id: string;
    email: string;
    rank: UserRank;
}

export async function createUserHandler(req: Request<any, any, UserCreationRequest>, res: Response<UserDataResponse>)
{
    if(req.user === undefined)
        return res.sendStatus(401);

    const data = req.body;

    const createdUser = await User.add(data.email, data.rank);
    if(createdUser === undefined)
        return res.sendStatus(409);

    return res.json({
        id: createdUser.id,
        email: createdUser.email,
        rank: createdUser.user_rank,
    });
}

export async function amendUserHandler(req: Request<any, any, UserAmendmentRequest>, res: Response<UserDataResponse>)
{
    if(req.user === undefined)
        return res.sendStatus(401);

    const data = req.body;

    const updatedUser = await User.update(data.email, data.rank);
    if(updatedUser === undefined)
        return res.sendStatus(404);

    return res.json({
        id: updatedUser.id,
        email: updatedUser.email,
        rank: updatedUser.user_rank,
    });
}

export async function getUserListHandler(req: Request, res: Response<UserDataResponse[]>)
{
    if(req.user === undefined)
        return res.sendStatus(401);
    
    const users = await User.find();

    const userDataList = users.map(user => ({
        id: user.id,
        email: user.email,
        rank: user.user_rank,
    }));

    return res.json(userDataList);
}

export async function deleteUserHandler(req: Request<any, any, UserDeletionRequest>, res: Response)
{
    if(req.user === undefined)
        return res.sendStatus(401);

    const data = req.body;

    const userCount = await User.find({ email: data.email }).countDocuments();
    if(!userCount)
        return res.sendStatus(404);

    const deleteResult = await User.deleteMany({ email: data.email });
    if(!deleteResult.acknowledged || !deleteResult.deletedCount)
        return res.sendStatus(500);

    return res.sendStatus(200);
}