import { RestClientV5 } from "bybit-api";

export class TickerProvider
{
    private restClient: RestClientV5;

    constructor(restClient: RestClientV5)
    {
        this.restClient = restClient;
    }

    public async get(symbol: string)
    {
        const tickerResponse = await this.restClient.getTickers({
            category: "linear",
            symbol
        });

        if(tickerResponse === undefined || tickerResponse.retCode !== 0)
            return undefined;

        return tickerResponse.result.list[0];
    }
}