import { Request, Response } from "express";
import { Credential, ICredential } from "../../../models/Credential.js";
import { UserRank } from "../../../models/User.js";

export interface CredentialParams
{
    key: string;
    secret: string;
    demoTrading: boolean;
    isActive: boolean;
}

export interface CredentialsResponse
{
    credentials: CredentialParams[];
    active_credential?: CredentialParams;
}

export interface CredentialsSubmitionRequest
{
    credentials: CredentialParams[];
}

export interface CredentialsActivationRequest
{
    key: string;
}

export interface CredentialsDeletionRequest
{
    key: string;
}

export interface UserDataResponse
{
    email: string;
    id: string;
    rank: UserRank;
}

export async function credentialsSubmitionHandler(req: Request<any, any, CredentialsSubmitionRequest>, res: Response)
{
    if(req.user === undefined)
        return res.sendStatus(401);

    const userId = req.user.id;

    const data = req.body;
    const postedCredentials = new Array<ICredential>();

    if(data.credentials)
        postedCredentials.push(...data.credentials.map((credential: CredentialParams) => ({ ...credential, userId })));

    await Credential.add(userId, postedCredentials);

    return res.sendStatus(200);
}

export async function credentialsActivationHandler(req: Request<any, any, CredentialsActivationRequest>, res: Response)
{
    if(req.user === undefined)
        return res.sendStatus(401);

    const userId = req.user.id;

    const data = req.body;

    const credentialToActivate = await Credential.getCredentialByKey(data.key);
    if(credentialToActivate === "error")
        return res.sendStatus(500);
    if(credentialToActivate === undefined)
        return res.sendStatus(404);

    if(userId !== credentialToActivate.userId)
        return res.sendStatus(401);

    await credentialToActivate.activate();
    return res.sendStatus(200);
}

export async function credentialsDeletionHandler(req: Request<any, any, CredentialsDeletionRequest>, res: Response)
{
    if(req.user === undefined)
        return res.sendStatus(401);

    const userId = req.user.id;

    const data = req.body;

    const credentialToDelete = await Credential.getCredentialByKey(data.key);
    if(credentialToDelete === "error")
        return res.sendStatus(500);
    if(credentialToDelete === undefined)
        return res.sendStatus(404);

    if(userId !== credentialToDelete.userId)
        return res.sendStatus(401);

    const deletionResponse = await Credential.deleteOne({ key: data.key });
    if(deletionResponse.deletedCount === 0)
        return res.sendStatus(404);

    return res.sendStatus(200);
}

export async function credentialsFetchingHandler(req: Request, res: Response<CredentialsResponse>)
{
    if(req.user === undefined)
        return res.sendStatus(401);

    const userId = req.user.id;

    const userCredentials = await Credential.getCredentialsByUserId(userId);
    if(userCredentials === "error")
        return res.sendStatus(500);
    
    const activeCredential = await Credential.getActiveCredential(userId);
    if(activeCredential === "error")
        return res.sendStatus(500);

    return res.json({
        credentials: userCredentials.map(credential => ({
            key: credential.key,
            secret: credential.secret,
            demoTrading: credential.demoTrading,
            isActive: credential.isActive,
        })),
        active_credential: activeCredential == undefined ? undefined : {
            key: activeCredential.key,
            secret: activeCredential.secret,
            demoTrading: activeCredential.demoTrading,
            isActive: activeCredential.isActive,
        }
    });
}

export async function userDataFetchingHandler(req: Request, res: Response<UserDataResponse>)
{
    if(req.user === undefined)
        return res.sendStatus(401);

    return res.json({
        email: req.user.email,
        id: req.user.id,
        rank: req.user.user_rank,
    });
}