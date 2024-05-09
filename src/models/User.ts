import mongoose, { Model } from "mongoose";
import { Credential } from "./Credential.js";

export interface IUser extends mongoose.Document
{
    google_id: string;
    email: string;
    credentials: Credential[];
    active_credential: Credential;
}

type UserModel = Model<IUser>;

const userSchema = new mongoose.Schema<IUser, UserModel>({
    google_id: { type: String, required: false },
    email: { type: String, required: true },
    credentials: [{ type: mongoose.Schema.Types.ObjectId, ref: "Credential", required: true }],
    active_credential: { type: mongoose.Schema.Types.ObjectId, ref: "Credential", required: false },
});

export const User = mongoose.model("User", userSchema);
export type User = InstanceType<typeof User>;