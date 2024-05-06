import { Request, Response } from "express";
import { OrderSide, OrderType } from "../../../models/Order.js";
import { Credential } from "../../../models/Credential.js";
import { OrderCoordinatorProvider } from "../../../core/OrderCoordinatorProvider.js";

export interface BaseQty
{
    symbol1BaseQty: number;
    symbol2BaseQty: number;
}

export interface OrderSubmitionRequest
{
    type: OrderType;
    side: OrderSide;
    symbol1: string;
    symbol2: string;
    regressionSlope: number;
    entryResidual?: number;
    takeProfit?: number;
    stopLoss?: number;
    quoteQty?: number;
    baseQty?: BaseQty;
}

export interface OrderSubmitionResponse
{
    orderId: string;
}

export async function orderSubmitionHandler(orderCoordinatorProvider: OrderCoordinatorProvider, req: Request<any, any, OrderSubmitionRequest>, res: Response<OrderSubmitionResponse>)
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

    const orderContext = await orderCoordinator.createOrder({
        type: req.body.type,
        side: req.body.side,
        symbol1: req.body.symbol1,
        symbol2: req.body.symbol2,
        regressionSlope: req.body.regressionSlope.toString(),
        entryResidual: req.body.entryResidual?.toString(),
        takeProfit: req.body.takeProfit?.toString(),
        stopLoss: req.body.stopLoss?.toString(),
        symbol1BaseQty: req.body.baseQty?.symbol1BaseQty.toString(),
        symbol2BaseQty: req.body.baseQty?.symbol2BaseQty.toString(),
    });

    return res.json({
        orderId: orderContext.order.id,
    });
}
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