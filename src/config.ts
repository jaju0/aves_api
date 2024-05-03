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
            BYBIT_INSTRUMENTS_INFO_REFETCH_INTERVAL_HOURS: string;
        }
    }
}

const config = {
    PORT: process.env.PORT ?? 4000,
    SESSION_SECRET: process.env.SESSION_SECRET,
    JSON_WEB_TOKEN_SECRET: process.env.JSON_WEB_TOKEN_SECRET,
    JSON_WEB_TOKEN_EXPIRES_IN: process.env.JSON_WEB_TOKEN_EXPIRES_IN === undefined ? 24 * 60 * 60 : +process.env.JSON_WEB_TOKEN_EXPIRES_IN,
    BYBIT_INSTRUMENTS_INFO_REFETCH_INTERVAL_HOURS: process.env.BYBIT_INSTRUMENTS_INFO_REFETCH_INTERVAL_HOURS === undefined ? 24 : +process.env.BYBIT_INSTRUMENTS_INFO_REFETCH_INTERVAL_HOURS,
};

if(config.SESSION_SECRET === undefined)
    throw new Error("environment variable SESSION_SECRET is undefined");

if(config.JSON_WEB_TOKEN_SECRET === undefined)
    throw new Error("environment variable JSON_WEB_TOKEN_SECRET is undefined");

export default config;