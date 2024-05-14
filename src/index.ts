import "dotenv/config.js";
import express from "express";
import session from "express-session";
import mongoose from "mongoose";
import { RestClientV5, WebsocketClient } from "bybit-api";
import expressWs from "express-ws";
import { OrderCoordinatorProvider } from "./core/OrderCoordinatorProvider.js";
import { BybitRestClientProvider } from "./core/BybitRestClientProvider.js";
import { InstrumentsInfoProvider } from "./core/InstrumentsInfoProvider.js";
import { TickerProvider } from "./core/TickerProvider.js";
import { PositionCoordinatorProvider } from "./core/PositionCoordinatorProvider.js";
import { WebsocketAgentProvider } from "./core/WebsocketAgentProvider.js";
import { v1Router } from "./routes/v1/index.js";
import config from "./config.js";
import "./strategies/google_oauth/Strategy.js";
import "./strategies/jwt/Strategy.js";

async function main()
{
    const bybitPublicRestClient = new RestClientV5();

    const bybitWsClient = new WebsocketClient({
        market: "v5",
    });

    const instrumentsInfoRefetchIntervalMs = config.BYBIT_INSTRUMENTS_INFO_REFETCH_INTERVAL_HOURS * 60 * 60 * 1000;

    const bybitRestClientProvider = new BybitRestClientProvider();
    const instInfoProvider = new InstrumentsInfoProvider(bybitPublicRestClient, instrumentsInfoRefetchIntervalMs);
    const tickerProivder = new TickerProvider(bybitPublicRestClient);
    const positionCoordinatorProvider = new PositionCoordinatorProvider(bybitRestClientProvider, bybitWsClient);
    const orderCoordinatorProvider = new OrderCoordinatorProvider(bybitRestClientProvider, bybitWsClient, instInfoProvider, tickerProivder, positionCoordinatorProvider);
    const websocketAgentProvider = new WebsocketAgentProvider();

    await mongoose.connect("mongodb://mongodb:27017/aves", {
        user: config.MONGOOSE_USER,
        pass: config.MONGOOSE_PASS,
    });

    await orderCoordinatorProvider.initialize();
    await positionCoordinatorProvider.initialize();

    const { app } = expressWs(express());

    app.use(session({
        secret: config.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
    }));

    app.use(express.json());
    app.use("/v1", v1Router(orderCoordinatorProvider, positionCoordinatorProvider, websocketAgentProvider));

    app.listen(config.PORT, () => {
        console.log(`aves api listening on port ${config.PORT}`);
    });
}

main();
