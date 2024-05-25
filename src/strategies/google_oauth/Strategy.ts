import passport from "passport";
import passportCustom from "passport-custom";
import { OAuth2Client } from "google-auth-library";
import config from "../../config.js";
import { User, IUser } from "../../models/User.js";

const CustomStrategy = passportCustom.Strategy;
const client = new OAuth2Client();

declare global
{
    namespace Express
    {
        interface User extends IUser {}
    }
}

passport.use("google-token", new CustomStrategy(
    async (req, done) => {
        if(req.body === undefined || req.body.id_token === undefined || typeof req.body.id_token !== "string")
            return done(undefined, null);

        try
        {
            const ticket = await client.verifyIdToken({
                idToken: req.body.id_token,
                audience: config.GOOGLE_OAUTH_CLIENT_ID,
            });

            const payload = ticket.getPayload();
            if(payload === undefined)
                return done(undefined, null);

            if(payload.email === undefined)
                return done(undefined, null);

            const foundUser = await User.findOne({ email: payload.email });
            if(foundUser === null)
                return done(undefined, null);

            foundUser.google_id = payload.sub;
            foundUser.save();

            return done(null, foundUser);
        }
        catch(error)
        {
            return done(undefined, null);
        }
    }
))
