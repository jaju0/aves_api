import passport from "passport";
import { OAuth2Strategy as GoogleStrategy, Profile, VerifyFunction } from "passport-google-oauth";
import config from "../../config.js";
import { User, IUser } from "../../models/User.js";

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
        clientID: config.GOOGLE_OAUTH_CLIENT_ID,
        clientSecret: config.GOOGLE_OAUTH_CLIENT_SECRET,
        callbackURL: config.GOOGLE_OAUTH_CALLBACK_URL,
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