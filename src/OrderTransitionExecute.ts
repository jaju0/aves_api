import { LinearInverseInstrumentInfoV5, RestClientV5 } from "bybit-api";
import Decimal from "decimal.js";
import { TickerProvider } from "./TickerProvider.js";
import { InstrumentsInfoProvider } from "./InstrumentsInfoProvider.js";
import { OrderTransitionStrategy } from "./OrderTransitionStrategy.js";
import { Order } from "./models/Order.js";

export class OrderTransitionExecute implements OrderTransitionStrategy
{
    private order: Order;
    private restClient: RestClientV5;
    private instInfoProvider: InstrumentsInfoProvider;
    private tickerProvider: TickerProvider;

    constructor(order: Order, restClient: RestClientV5, instInfoProvider: InstrumentsInfoProvider, tickerProvider: TickerProvider)
    {
        this.order = order;
        this.restClient = restClient;
        this.instInfoProvider = instInfoProvider;
        this.tickerProvider = tickerProvider;
    }

    public async doTransition()
    {
        if(this.order.executed)
            return true;

        const symbol1InstInfo = await this.instInfoProvider.get(this.order.symbol1);
        const symbol2InstInfo = await this.instInfoProvider.get(this.order.symbol2);

        if(symbol1InstInfo === undefined || symbol2InstInfo === undefined)
            return false;

        let roundedContractSizes: ReturnType<typeof this.roundContractSizes>;
        if(this.order.quoteQty !== undefined)
        {
            const contractSizes = await this.calculateContractSizesFromQuoteQuantity(new Decimal(this.order.quoteQty));
            if(contractSizes === undefined)
                return false;

            roundedContractSizes = this.roundContractSizes(contractSizes.symbol1ContractSize, contractSizes.symbol2ContractSize, symbol1InstInfo, symbol2InstInfo);
        }
        else if(this.order.symbol1BaseQty !== undefined && this.order.symbol2BaseQty !== undefined)
        {
            const symbol1ContractSize = new Decimal(this.order.symbol1BaseQty);
            const symbol2ContractSize = new Decimal(this.order.symbol2BaseQty);

            roundedContractSizes = this.roundContractSizes(symbol1ContractSize, symbol2ContractSize, symbol1InstInfo, symbol2InstInfo);
        }
        else
            return false;

        await this.restClient.submitOrder({
            category: "linear",
            orderType: "Market",
            side: this.order.side,
            symbol: this.order.symbol1,
            qty: roundedContractSizes.symbol1ContractSize.toString(),
        });

        await this.restClient.submitOrder({
            category: "linear",
            orderType: "Market",
            side: this.order.side === "Buy" ? "Sell" : "Buy",
            symbol: this.order.symbol2,
            qty: roundedContractSizes.symbol2ContractSize.toString(),
        });

        this.order.updateOne({
            symbol1BaseQty: roundedContractSizes.symbol1ContractSize.toString(),
            symbol2BaseQty: roundedContractSizes.symbol2ContractSize.toString(),
            executed: true,
        });

        return true;
    }

    private async calculateContractSizesFromQuoteQuantity(quoteQty: Decimal)
    {
        const symbol1Tickers = await this.tickerProvider.get(this.order.symbol1);
        const symbol2Tickers = await this.tickerProvider.get(this.order.symbol2);

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

        symbol1ContractSize = new Decimal(symbol1BaseAssetValue).dividedBy(symbol1QtyStep).round().times(symbol1QtyStep);
        symbol2ContractSize = new Decimal(symbol2BaseAssetValue).dividedBy(symbol2QtyStep).round().times(symbol2QtyStep);

        if(symbol1BaseAssetValue.lessThan(symbol1InstInfo.lotSizeFilter.minOrderQty))
            symbol1ContractSize = new Decimal(symbol1InstInfo.lotSizeFilter.minOrderQty);
        if(symbol2BaseAssetValue.lessThan(symbol2InstInfo.lotSizeFilter.minOrderQty))
            symbol2ContractSize = new Decimal(symbol2InstInfo.lotSizeFilter.minOrderQty);

        return { symbol1ContractSize, symbol2ContractSize };
    }
}