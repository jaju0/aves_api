import { LinearInverseInstrumentInfoV5 } from "bybit-api";
import Decimal from "decimal.js";
import { OrderContext } from "./OrderContext.js";
import { OrderState } from "./OrderState.js";
import { OrderStateExecuted } from "./OrderStateExecuted.js";
import { OrderStateFailed } from "./OrderStateFailed.js";

export class OrderStateExecute extends OrderState
{
    constructor(context: OrderContext)
    {
        super(context);
    }

    public async initialize()
    {
        if(this.context.order.status === "Executed")
        {
            await this.context.transitionTo(new OrderStateExecuted(this.context));
            return;
        }

        const symbol1InstInfo = await this.context.instInfoProvider.get(this.context.order.symbol1);
        const symbol2InstInfo = await this.context.instInfoProvider.get(this.context.order.symbol2);

        if(symbol1InstInfo === undefined || symbol2InstInfo === undefined)
        {
            await this.context.transitionTo(new OrderStateFailed(this.context));
            return;
        }

        let roundedContractSizes: ReturnType<typeof this.roundContractSizes>;
        if(this.context.order.quoteQty !== undefined)
        {
            const contractSizes = await this.calculateContractSizesFromQuoteQuantity(new Decimal(this.context.order.quoteQty));
            if(contractSizes === undefined)
            {
                await this.context.transitionTo(new OrderStateFailed(this.context));
                return;
            }

            roundedContractSizes = this.roundContractSizes(contractSizes.symbol1ContractSize, contractSizes.symbol2ContractSize, symbol1InstInfo, symbol2InstInfo);
        }
        else if(this.context.order.symbol1BaseQty !== undefined && this.context.order.symbol2BaseQty !== undefined)
        {
            const symbol1ContractSize = new Decimal(this.context.order.symbol1BaseQty);
            const symbol2ContractSize = new Decimal(this.context.order.symbol2BaseQty);

            roundedContractSizes = this.roundContractSizes(symbol1ContractSize, symbol2ContractSize, symbol1InstInfo, symbol2InstInfo);
        }
        else
        {
            await this.context.transitionTo(new OrderStateFailed(this.context));
            return;
        }

        const symbol1SubmitionResponse = await this.context.restClient.submitOrder({
            category: "linear",
            orderType: "Market",
            side: this.context.order.side,
            symbol: this.context.order.symbol1,
            qty: roundedContractSizes.symbol1ContractSize.toString(),
        });

        const symbol2SubmitionResponse = await this.context.restClient.submitOrder({
            category: "linear",
            orderType: "Market",
            side: this.context.order.side === "Buy" ? "Sell" : "Buy",
            symbol: this.context.order.symbol2,
            qty: roundedContractSizes.symbol2ContractSize.toString(),
        });

        if(
            symbol1SubmitionResponse === undefined || symbol1SubmitionResponse.retCode !== 0 ||
            symbol2SubmitionResponse === undefined || symbol2SubmitionResponse.retCode !== 0
        )
        {
            await this.context.transitionTo(new OrderStateFailed(this.context));
            return;
        }

        const symbol1OrderResponse = await this.context.restClient.getActiveOrders({
            category: "linear",
            orderId: symbol1SubmitionResponse.result.orderId,
        });

        const symbol2OrderResponse = await this.context.restClient.getActiveOrders({
            category: "linear",
            orderId: symbol2SubmitionResponse.result.orderId,
        });

        if(
            symbol1SubmitionResponse === undefined || symbol1SubmitionResponse.retCode !== 0 ||
            symbol2SubmitionResponse === undefined || symbol2SubmitionResponse.retCode !== 0
        )
        {
            await this.context.transitionTo(new OrderStateFailed(this.context));
            return;
        }

        const symbol1Order = symbol1OrderResponse.result.list[0];
        const symbol2Order = symbol2OrderResponse.result.list[0];

        this.context.symbol1OrderId = symbol1SubmitionResponse.result.orderId;
        this.context.symbol2OrderId = symbol2SubmitionResponse.result.orderId;

        this.context.order.status = "Execute";
        this.context.order.symbol1BaseQty = roundedContractSizes.symbol1ContractSize.toString();
        this.context.order.symbol2BaseQty = roundedContractSizes.symbol2ContractSize.toString();
        this.context.order.symbol1EntryPrice = symbol1Order.avgPrice === "" || symbol1Order.avgPrice === "0" ? symbol1Order.price : symbol1Order.avgPrice;
        this.context.order.symbol2EntryPrice = symbol2Order.avgPrice === "" || symbol2Order.avgPrice === "0" ? symbol2Order.price : symbol2Order.avgPrice;
        this.context.setDocumentExpiration();
        await this.context.order.save();

        await this.context.transitionTo(new OrderStateExecuted(this.context));
    }

    public residualUpdate(residual: Decimal)
    {
    }

    private async calculateContractSizesFromQuoteQuantity(quoteQty: Decimal)
    {
        const symbol1Tickers = await this.context.tickerProvider.get(this.context.order.symbol1);
        const symbol2Tickers = await this.context.tickerProvider.get(this.context.order.symbol2);

        if(symbol1Tickers === undefined || symbol2Tickers === undefined)
            return undefined;

        const symbol1MidPrice = new Decimal(symbol1Tickers.bid1Price).plus(symbol1Tickers.ask1Price).dividedBy(2);
        const symbol2MidPrice = new Decimal(symbol2Tickers.bid1Price).plus(symbol2Tickers.ask1Price).dividedBy(2);

        const symbol1ContractSize = quoteQty.dividedBy(symbol1MidPrice);
        const symbol2ContractSize = quoteQty.dividedBy(symbol2MidPrice);

        return { symbol1ContractSize, symbol2ContractSize };
    }

    private roundContractSizes(symbol1BaseAssetValue: Decimal, symbol2BaseAssetValue: Decimal, symbol1InstInfo: LinearInverseInstrumentInfoV5, symbol2InstInfo: LinearInverseInstrumentInfoV5)
    {
        const symbol1QtyStep = new Decimal(symbol1InstInfo.lotSizeFilter.qtyStep);
        const symbol2QtyStep = new Decimal(symbol2InstInfo.lotSizeFilter.qtyStep);

        let symbol1ContractSize: Decimal;
        let symbol2ContractSize: Decimal;

        Decimal.set({ rounding: Decimal.ROUND_HALF_CEIL });
        symbol1ContractSize = new Decimal(symbol1BaseAssetValue).dividedBy(symbol1QtyStep).round().times(symbol1QtyStep);
        symbol2ContractSize = new Decimal(symbol2BaseAssetValue).dividedBy(symbol2QtyStep).round().times(symbol2QtyStep);

        if(symbol1BaseAssetValue.lessThan(symbol1InstInfo.lotSizeFilter.minOrderQty))
            symbol1ContractSize = new Decimal(symbol1InstInfo.lotSizeFilter.minOrderQty);
        if(symbol2BaseAssetValue.lessThan(symbol2InstInfo.lotSizeFilter.minOrderQty))
            symbol2ContractSize = new Decimal(symbol2InstInfo.lotSizeFilter.minOrderQty);

        return { symbol1ContractSize, symbol2ContractSize };
    }
}