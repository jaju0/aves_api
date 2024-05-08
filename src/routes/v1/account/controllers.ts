import { Request, Response } from "express";
import { Credential, ICredential } from "../../../models/Credential.js";

export interface CredentialParams
{
    key: string;
    secret: string;
    demoTrading: boolean;
}

export interface CredentialsResponse
{
    credentials: CredentialParams[];
    active_credential: CredentialParams;
}

export interface CredentialsRequest
{
    credentials?: CredentialParams[];
    active_credential?: CredentialParams;
}

export interface UserDataResponse
{
    email: string;
    google_id: string;
}

export async function credentialsSubmitionHandler(req: Request<any, any, CredentialsRequest>, res: Response<CredentialsResponse>)
{
    if(req.user === undefined)
        return res.sendStatus(401);

    const userGoogleId = req.user.google_id;

    const data = req.body;
    const postedCredentials = new Array<ICredential>();

    if(data.active_credential)
        postedCredentials.push({ ...data.active_credential, googleId: req.user.google_id, isActive: false });
    if(data.credentials)
        postedCredentials.push(...data.credentials.map((credential: CredentialParams) => ({ ...credential, googleId: userGoogleId, isActive: false })));

    await Credential.add(req.user.google_id, postedCredentials);

    if(data.active_credential)
    {
        const credentialToActivate = await Credential.getCredentialByKey(data.active_credential.key);
        if(credentialToActivate === "error")
            return res.sendStatus(500);
        if(credentialToActivate)
            await credentialToActivate.activate(req.user.google_id);
    }

    const userCredentials = await Credential.getCredentialsByGoogleId(req.user.google_id);
    if(userCredentials === "error")
        return res.sendStatus(500);

    const activeCredential = await Credential.getActiveCredential(req.user.google_id);
    if(activeCredential === "error")
        return res.sendStatus(500);

    return res.json({
        credentials: userCredentials.map(credential => ({
            key: credential.key,
            secret: credential.secret,
            demoTrading: credential.demoTrading,
        })),
        active_credential: activeCredential === undefined ? {} as CredentialParams : {
            key: activeCredential.key,
            secret: activeCredential.secret,
            demoTrading: activeCredential.demoTrading,
        },
    })
}

export async function credentialsFetchingHandler(req: Request, res: Response<CredentialsResponse>)
{
    if(req.user === undefined)
        return res.sendStatus(401);

    const userCredentials = await Credential.getCredentialsByGoogleId(req.user.google_id);
    if(userCredentials === "error")
        return res.sendStatus(500);
    
    const activeCredential = await Credential.getActiveCredential(req.user.google_id);
    if(activeCredential === "error")
        return res.sendStatus(500);

    return res.json({
        credentials: userCredentials.map(credential => ({
            key: credential.key,
            secret: credential.secret,
            demoTrading: credential.demoTrading,
        })),
        active_credential: activeCredential == undefined ? {} as CredentialParams : {
            key: activeCredential.key,
            secret: activeCredential.secret,
            demoTrading: activeCredential.demoTrading,
        }
    });
}

export async function userDataFetchingHandler(req: Request, res: Response<UserDataResponse>)
{
    if(req.user === undefined)
        return res.sendStatus(401);

    return res.json({
        email: req.user.email,
        google_id: req.user.google_id,
    });
}