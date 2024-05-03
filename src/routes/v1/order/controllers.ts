import { Request, Response } from "express";
import { OrderSide, OrderType } from "../../../models/Order.js";
import { Credential } from "../../../models/Credential.js";
import { OrderCoordinatorProvider } from "../../../OrderCoordinatorProvider.js";

export interface BaseQty
{
    symbol1BaseQty: number;
    symbol2BaseQty: number;
}

export interface OrderSubmitionResponse
{
    type: OrderType;
    side: OrderSide;
    symbol1: string;
    symbol2: string;
    regressionSlope: number;
    entryResidual: number;
    takeProfit?: number;
    stopLoss?: number;
    quoteQty?: number;
    baseQty?: BaseQty;
}

export async function orderSubmitionHandler(orderCoordinatorProvider: OrderCoordinatorProvider, req: Request, res: Response)
{
    if(req.user === undefined)
        return res.sendStatus(401);

    const data = req.body;

    const activeCredential = await Credential.getActiveCredential();
    if(activeCredential === "error")
        return res.sendStatus(500);
    else if(activeCredential == undefined)
        return res.sendStatus(400);

    const orderCoordinator = orderCoordinatorProvider.get(activeCredential.key, activeCredential.secret, activeCredential.demoTrading);
    orderCoordinator.createOrder(req.body); // <--- TODO: get the order data from here

    return res.sendStatus(200); // <--- TODO: pass the order data received from orderCoordinator.createOrder() here
}