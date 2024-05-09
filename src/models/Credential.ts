import mongoose, { Model } from "mongoose";

export interface ICredential
{
    userId: string;
    key: string;
    secret: string;
    demoTrading: boolean;
    isActive: boolean;
}

interface CredentialMethods
{
    activate(userId: string): Promise<void>;
    deactivate(): Promise<void>;
}

interface CredentialModel extends Model<ICredential, {}, CredentialMethods>
{
    add(userId: string, credentials: ICredential[]): Promise<void | "error">;
    getActiveCredential(userId: string): Promise<Credential | undefined | "error">;
    getCredentialByKey(key: string): Promise<Credential | undefined | "error">;
    getCredentialsByUserId(userId: string): Promise<Credential[] | "error">;
}

const credentialSchema = new mongoose.Schema<ICredential, CredentialModel, CredentialMethods>({
    userId: { type: String, required: true },
    key: { type: String, required: true },
    secret: { type: String, required: true },
    demoTrading: { type: Boolean, required: true },
    isActive: { type: Boolean, required: true },
});

credentialSchema.method("activate", async function activate(userId: string) {
    await Credential.updateMany({ userId }, { isActive: false });
    await this.updateOne({ isActive: true });
    this.isActive = true;
});

credentialSchema.method("deactivate", async function deactivate() {
    await this.updateOne({ isActive: false });
    this.isActive = false;
});

credentialSchema.static("add", async function add(userId: string, credentials: ICredential[]) {
    const userCredentials = await this.find({ userId });
    const credentialsToInsert = new Array<ICredential>();
    for(const newCredential of credentials)
    {
        const foundCredential = userCredentials.find(credential => newCredential.key === credential.key);
        if(foundCredential !== undefined)
            continue;

        newCredential.isActive = false;
        credentialsToInsert.push(newCredential);
    }

    try
    {
        await this.insertMany(credentialsToInsert);
    }
    catch(error)
    {
        console.log(error);
        return "error";
    }
});

credentialSchema.static("getActiveCredential", async function getActiveCredential(userId: string) {
    try
    {
        const activeCredential = await Credential.findOne({ userId, isActive: true });
        return activeCredential;
    }
    catch(error)
    {
        console.log(error);
        return "error";
    }
});

credentialSchema.static("getCredentialByKey", async function getCredentialByKey(key: string) {
    try
    {
        const credential = await Credential.findOne({ key });
        return credential;
    }
    catch(error)
    {
        console.log(error);
        return "error";
    }
});

credentialSchema.static("getCredentialsByUserId", async function getCredentialsByUserId(userId: string) {
    try
    {
        const credentials = await Credential.find({ userId });
        return credentials;
    }
    catch(error)
    {
        console.log(error);
        return "error";
    }
});

export const Credential = mongoose.model<ICredential, CredentialModel>("Credential", credentialSchema);
export type Credential = InstanceType<typeof Credential>;