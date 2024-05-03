import passport from "passport";
import { ExtractJwt, Strategy as JwtStrategy } from "passport-jwt";
import { User } from "../../models/User.js";

const JSON_WEB_TOKEN_SECRET = process.env.JSON_WEB_TOKEN_SECRET;

if(JSON_WEB_TOKEN_SECRET === undefined)
    throw new Error("environment variable JSON_WEB_TOKEN_SECRET is undefined");

passport.use(new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: JSON_WEB_TOKEN_SECRET,
}, async (jwtPayload: { google_id: string }, done) => {
    const foundUser = await User.findOne({
        google_id: jwtPayload.google_id,
    });

    done(null, foundUser);
}));