import axios from "axios";
import { Request, Response } from "express";
import { KlineIntervalV3 } from "bybit-api";
import { Pair } from "../../../models/Pair.js";
import config from "../../../config.js";

export interface PairData
{
    id: string;
    created_at: Date;
    symbol1: string;
    symbol2: string;
    interval: KlineIntervalV3;
    slope: number;
    tstat: number;
    lag: number;
    half_life: number;
}

export interface StatusResponse
{
    isRunning: boolean;
}

export type PairsResponse = PairData[];

export async function getPairsHandler(req: Request, res: Response<PairsResponse>)
{
    if(req.user === undefined)
        return res.sendStatus(401);

    const pairs = await Pair.find().sort({ created_at: -1 }).limit(+config.PAIRS_SELECTION_LIMIT);

    return res.json(pairs.map(document => <PairData> {
        id: document.id,
        created_at: document.created_at,
        symbol1: document.symbol1,
        symbol2: document.symbol2,
        interval: document.interval,
        slope: document.slope,
        tstat: document.tstat,
        lag: document.lag,
        half_life: document.half_life,
    }));
}

export async function pairFinderStatusHandler(req: Request, res: Response<StatusResponse>)
{
    if(req.user === undefined)
        return res.sendStatus(401);

    const statusResponse = await axios.get("/status", {
        baseURL: config.PAIR_FINDER_API_URL,
    });

    return res.status(statusResponse.status).send(statusResponse.data);
}

export async function startPairFinderHandler(req: Request, res: Response<StatusResponse>)
{
    if(req.user === undefined)
        return res.sendStatus(401);

    const statusResposne = await axios.post("/start", undefined, {
        baseURL: config.PAIR_FINDER_API_URL,
    });

    return res.status(statusResposne.status).send(statusResposne.data);
}

export async function stopPairFinderHandler(req: Request, res: Response<StatusResponse>)
{
    if(req.user === undefined)
        return res.sendStatus(401);

    const statusResponse = await axios.post("/stop", undefined, {
        baseURL: config.PAIR_FINDER_API_URL,
    });

    return res.status(statusResponse.status).send(statusResponse.data);
}