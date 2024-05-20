import mongoose, { Model } from "mongoose";
import { Credential } from "./Credential.js";

export const userRank = ["ADMIN", "USER", "NONE"] as const;
export type UserRank = typeof userRank[number];

export interface IUser extends mongoose.Document
{
    google_id: string;
    email: string;
    credentials: Credential[];
    active_credential: Credential;
    user_rank: UserRank;
}

interface UserModel extends Model<IUser>
{
    add(email: string, rank: UserRank): Promise<User | undefined>;
    update(email: string, rank: UserRank): Promise<User | undefined>;
}

const userSchema = new mongoose.Schema<IUser, UserModel>({
    google_id: { type: String, required: false },
    email: { type: String, required: true },
    credentials: [{ type: mongoose.Schema.Types.ObjectId, ref: "Credential", required: true }],
    active_credential: { type: mongoose.Schema.Types.ObjectId, ref: "Credential", required: false },
    user_rank: { type: String, required: true, default: "NONE" },
});

userSchema.static("add", async function add(email: string, rank: UserRank) {
    const numberOfUsersWithEmailAddress = await this.countDocuments({ email });
    const doesUserExist = numberOfUsersWithEmailAddress > 0;

    if(doesUserExist)
        return undefined;

    const newUser = new User({
        email,
        user_rank: rank,
        credentials: [],
    });

    await newUser.save();

    return newUser;
});

userSchema.static("update", async function update(email: string, rank: UserRank) {
    const user = await this.findOne({ email });
    if(!user)
        return undefined;

    user.user_rank = rank;
    await user.save();

    return user;
});

export const User = mongoose.model<IUser, UserModel>("User", userSchema);
export type User = InstanceType<typeof User>;