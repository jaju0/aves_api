import { RestClientV5 } from "bybit-api";

export class BybitRestClientProvider
{
    private clients: Map<string, RestClientV5>;

    constructor()
    {
        this.clients = new Map();
    }

    public get(apiKey: string, apiSecret: string, demoTrading: boolean)
    {
        let foundRestClient = this.clients.get(apiKey);
        if(foundRestClient === undefined)
        {
            foundRestClient = new RestClientV5({
                key: apiKey,
                secret: apiSecret,
                demoTrading: demoTrading,
            });

            this.clients.set(apiKey, foundRestClient);
        }

        return foundRestClient;
    }
}