import { Position, PositionSide } from "../models/Position.js";
import { Order, OrderSide, OrderStatus, OrderType } from "../models/Order.js";

export interface OrderEventData
{
    id: string;
    ownerId: string;
    status: OrderStatus;
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
}

export interface PositionEventData
{
    id: string;
    ownerId: string;
    side: PositionSide;
    symbol1: string;
    symbol2: string;
    symbol1EntryPrice: string;
    symbol2EntryPrice: string;
    symbol1BaseQty: string;
    symbol2BaseQty: string;
    lastPnl: string;
    regressionSlope: string;
    takeProfit?: string;
    stopLoss?: string;
    open: boolean;
}

export function orderModelToEventData(order: Order)
{
    const eventData = <OrderEventData> {
        id: order.id,
        ownerId: order.ownerId,
        status: order.status,
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
    };

    return eventData;
}

export function positionModelToEventData(position: Position)
{
    const eventData = <PositionEventData> {
        id: position.id,
        ownerId: position.ownerId,
        side: position.side,
        symbol1: position.symbol1,
        symbol2: position.symbol2,
        symbol1EntryPrice: position.symbol1EntryPrice,
        symbol2EntryPrice: position.symbol2EntryPrice,
        symbol1BaseQty: position.symbol1BaseQty,
        symbol2BaseQty: position.symbol2BaseQty,
        lastPnl: position.lastPnl,
        regressionSlope: position.regressionSlope,
        takeProfit: position.takeProfit,
        stopLoss: position.stopLoss,
        open: position.open,
    };

    return eventData;
}