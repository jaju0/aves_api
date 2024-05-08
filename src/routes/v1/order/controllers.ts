import { Request, Response } from "express";
import { Order, OrderSide, OrderType } from "../../../models/Order.js";
import { Credential } from "../../../models/Credential.js";
import { OrderCoordinatorProvider } from "../../../core/OrderCoordinatorProvider.js";

export interface BaseQty
{
    symbol1BaseQty: number;
    symbol2BaseQty: number;
}

export interface OrderData
{
    orderId: string;
    type: OrderType;
    side: OrderSide;
    symbol1: string;
    symbol2: string;
    symbol1BaseQty: string;
    symbol2BaseQty: string;
    quoteQty?: string;
    entryResidual?: string;
    regressionSlope: string;
    takeProfit?: string;
    stopLoss?: string;
    executed: boolean;
    failed: boolean;
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

export interface OrderAmendmentRequest
{
    orderId: string;
    entryResidual: number;
}

export type OrderListResponse = OrderData[];

function orderDocumentToResponseData(order: Order)
{
    return <OrderData> {
        orderId: order.id,
        type: order.type,
        side: order.side,
        symbol1: order.symbol1,
        symbol2: order.symbol2,
        symbol1BaseQty: order.symbol1BaseQty,
        symbol2BaseQty: order.symbol2BaseQty,
        quoteQty: order.quoteQty,
        entryResidual: order.entryResidual,
        regressionSlope: order.regressionSlope,
        takeProfit: order.takeProfit,
        stopLoss: order.stopLoss,
        executed: order.executed,
        failed: order.failed,
    };
}

export async function orderSubmitionHandler(orderCoordinatorProvider: OrderCoordinatorProvider, req: Request<any, any, OrderSubmitionRequest>, res: Response<OrderSubmitionResponse>)
{
    if(req.user === undefined)
        return res.sendStatus(401);

    const data = req.body;

    const activeCredential = await Credential.getActiveCredential(req.user.google_id);
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
        quoteQty: req.body.quoteQty?.toString(),
    });

    return res.json({
        orderId: orderContext.order.id,
    });
}

export async function orderAmendmentHandler(orderCoordinatorProvider: OrderCoordinatorProvider, req: Request<any, any, OrderAmendmentRequest>, res: Response)
{
    if(req.user === undefined)
        return res.sendStatus(401);

    const data = req.body;

    const activeCredential = await Credential.getActiveCredential(req.user.google_id);
    if(activeCredential === "error")
        return res.sendStatus(500);
    else if(activeCredential == undefined)
        return res.sendStatus(400);

    const orderCoordinator = orderCoordinatorProvider.get(activeCredential.key, activeCredential.secret, activeCredential.demoTrading);
    const orderData = orderCoordinator.getOrderData(req.body.orderId);
    if(orderData === undefined)
        return res.sendStatus(404);

    orderData.amendEntryResidual(data.entryResidual);
    return res.sendStatus(200);
}

export async function orderListHandler(orderCoordinatorProvider: OrderCoordinatorProvider, req: Request, res: Response<OrderListResponse>)
{
    if(req.user === undefined)
        return res.sendStatus(401);

    const activeCredential = await Credential.getActiveCredential(req.user.google_id);
    if(activeCredential === "error")
        return res.sendStatus(500);
    else if(activeCredential == undefined)
        return res.sendStatus(400);

    const orderCoordinator = orderCoordinatorProvider.get(activeCredential.key, activeCredential.secret, activeCredential.demoTrading);

    const activeOrderList = new Array<OrderData>();
    for(const context of orderCoordinator.OrderContexts.values())
        activeOrderList.push(orderDocumentToResponseData(context.order));

    return res.json(activeOrderList);
}