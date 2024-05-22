import "dotenv/config.js";

declare global
{
    namespace NodeJS
    {
        export interface ProcessEnv
        {
            PORT: string;
            SESSION_SECRET: string;
            JSON_WEB_TOKEN_SECRET: string;
            JSON_WEB_TOKEN_EXPIRES_IN: string;
            JSON_WEB_TOKEN_REFRESH_SECRET: string;
            JSON_WEB_TOKEN_REFRESH_EXPIRES_IN: string;
            MONGODB_PORT: string;
            MONGODB_DB_NAME: string;
            MONGOOSE_USER?: string;
            MONGOOSE_PASS?: string;
            MONGOOSE_AUTH_SOURCE?: string;
            BYBIT_INSTRUMENTS_INFO_REFETCH_INTERVAL_HOURS: string;
            POSITION_PNL_UPDATE_INTERVAL_MS: string;
            INITIAL_ADMIN_EMAIL_ADDRESS: string;
        }
    }
}

const config = {
    PORT: process.env.PORT ?? 4000,
    SESSION_SECRET: process.env.SESSION_SECRET,
    JSON_WEB_TOKEN_SECRET: process.env.JSON_WEB_TOKEN_SECRET,
    JSON_WEB_TOKEN_EXPIRES_IN: process.env.JSON_WEB_TOKEN_EXPIRES_IN === undefined ? 10 * 60 : +process.env.JSON_WEB_TOKEN_EXPIRES_IN,
    JSON_WEB_TOKEN_REFRESH_SECRET: process.env.JSON_WEB_TOKEN_REFRESH_SECRET,
    JSON_WEB_TOKEN_REFRESH_EXPIRES_IN: process.env.JSON_WEB_TOKEN_REFRESH_EXPIRES_IN === undefined ? 24 * 60 * 60 : +process.env.JSON_WEB_TOKEN_REFRESH_EXPIRES_IN,
    MONGODB_PORT: process.env.MONGODB_PORT === undefined ? 27017 : +process.env.MONGODB_PORT,
    MONGODB_DB_NAME: process.env.MONGODB_DB_NAME ?? "aves",
    MONGOOSE_USER: process.env.MONGOOSE_USER,
    MONGOOSE_PASS: process.env.MONGOOSE_PASS,
    MONGOOSE_AUTH_SOURCE: process.env.MONGOOSE_AUTH_SOURCE,
    BYBIT_INSTRUMENTS_INFO_REFETCH_INTERVAL_HOURS: process.env.BYBIT_INSTRUMENTS_INFO_REFETCH_INTERVAL_HOURS === undefined ? 24 : +process.env.BYBIT_INSTRUMENTS_INFO_REFETCH_INTERVAL_HOURS,
    POSITION_PNL_UPDATE_INTERVAL_MS: process.env.POSITION_PNL_UPDATE_INTERVAL_MS === undefined ? 5000 : +process.env.POSITION_PNL_UPDATE_INTERVAL_MS,
    INITIAL_ADMIN_EMAIL_ADDRESS: process.env.INITIAL_ADMIN_EMAIL_ADDRESS,
};

if(config.SESSION_SECRET === undefined)
    throw new Error("environment variable SESSION_SECRET is undefined");

if(config.JSON_WEB_TOKEN_SECRET === undefined)
    throw new Error("environment variable JSON_WEB_TOKEN_SECRET is undefined");

if(config.JSON_WEB_TOKEN_REFRESH_SECRET === undefined)
    throw new Error("environment variable JSON_WEB_TOKEN_REFRESH_SECRET is undefined");

if(config.INITIAL_ADMIN_EMAIL_ADDRESS === undefined)
    throw new Error("environment variable INITIAL_ADMIN_EMAIL_ADDRESS is undefined");

export default config;