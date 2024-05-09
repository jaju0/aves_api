import passport from "passport";
import { ExtractJwt, Strategy as JwtStrategy } from "passport-jwt";
import { User } from "../../models/User.js";

const JSON_WEB_TOKEN_SECRET = process.env.JSON_WEB_TOKEN_SECRET;

if(JSON_WEB_TOKEN_SECRET === undefined)
    throw new Error("environment variable JSON_WEB_TOKEN_SECRET is undefined");

passport.use("jwt-bearer", new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: JSON_WEB_TOKEN_SECRET,
}, async (jwtPayload: { user_id: string }, done) => {
    const foundUser = await User.findOne({
        id: jwtPayload.user_id,
    });

    done(null, foundUser);
}));

passport.use("jwt-query", new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromUrlQueryParameter("token"),
    secretOrKey: JSON_WEB_TOKEN_SECRET,
}, async (jwtPayload: { user_id: string }, done) => {
    console.log("inside jwt-query strategy");
    console.log(jwtPayload);
    const foundUser = await User.findOne({
        id: jwtPayload.user_id,
    });

    done(null, foundUser);
}));