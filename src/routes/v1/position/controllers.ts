import { Request, Response } from "express";
import { Credential } from "../../../models/Credential.js";
import { Position, PositionSide } from "../../../models/Position.js";
import { PositionCoordinatorProvider } from "../../../core/PositionCoordinatorProvider.js";

export interface PositionData
{
    positionId: string;
    side: PositionSide;
    symbol1: string;
    symbol2: string;
    symbol1EntryPrice: string;
    symbol2EntryPrice: string;
    symbol1BaseQty: string;
    symbol2BaseQty: string;
    regressionSlope: string;
    takeProfit?: string;
    stopLoss?: string;
    open: boolean;
}

function positionDocumentToResponseData(position: Position)
{
    return <PositionData> {
        positionId: position.id,
        side: position.side,
        symbol1: position.symbol1,
        symbol2: position.symbol2,
        symbol1EntryPrice: position.symbol1EntryPrice,
        symbol2EntryPrice: position.symbol2EntryPrice,
        symbol1BaseQty: position.symbol1BaseQty,
        symbol2BaseQty: position.symbol2BaseQty,
        regressionSlope: position.regressionSlope,
        takeProfit: position.takeProfit,
        stopLoss: position.stopLoss,
        open: position.open,
    };
}

export type PositionListResponse = PositionData[];

export async function getPositionListHandler(positionCoordinatorProvider: PositionCoordinatorProvider, req: Request, res: Response<PositionListResponse>)
{
    if(req.user === undefined)
        return res.sendStatus(401);

    const activeCredential = await Credential.getActiveCredential();
    if(activeCredential === "error")
        return res.sendStatus(500);
    else if(activeCredential == undefined)
        return res.sendStatus(400);

    const positionCoordinator = positionCoordinatorProvider.get(activeCredential.key, activeCredential.secret, activeCredential.demoTrading);

    const activePositionList = new Array<PositionData>();
    for(const context of positionCoordinator.PositionContexts.values())
    {
        if(context.position.open)
            activePositionList.push(positionDocumentToResponseData(context.position));
    }

    return res.json(activePositionList);
}