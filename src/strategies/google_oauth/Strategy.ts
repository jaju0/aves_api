import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import passport from "passport";
import { OAuth2Strategy as GoogleStrategy, Profile, VerifyFunction } from "passport-google-oauth";
import { User, IUser } from "../../models/User.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const credentials = JSON.parse(fs.readFileSync(__dirname + "/credentials.json", "utf8"));

declare global
{
    namespace Express
    {
        interface User extends IUser {}
    }
}

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser<string>(async (id, done) => {
    try
    {
        const user = await User.findOne({ id });
        done(null, user);
    }
    catch(error)
    {
        done(error);
    }
});

passport.use(new GoogleStrategy({
        clientID: credentials.web.client_id,
        clientSecret: credentials.web.client_secret,
        callbackURL: credentials.web.redirect_uris[0],
    },
    async (accessToken: string, refreshToken: string, profile: Profile, done: VerifyFunction) =>
    {
        const profileEmails = profile.emails?.map(emailEntry => emailEntry.value);

        let foundUser = await User.findOne({
            email: { $in: profileEmails },
        });

        if(foundUser === null)
            return done(new Error("invalid user"), null);

        foundUser.google_id = profile.id;
        foundUser.save();

        return done(null, foundUser);
    }
));