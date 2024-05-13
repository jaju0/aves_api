import EventEmitter from "events";
import { RawData, WebSocket } from "ws";
import PubSub from "pubsub-js";

const topics = new Set(["order", "position"]);

interface WebsocketRequest
{
    reqId?: string;
    op: string;
    args: any;
}

interface WebsocketResponse
{
    reqId?: string;
    op: string;
    success: boolean;
    status: string;
}

interface SubscriptionMessage
{
    topic: string;
    data: any;
}

interface RequestHandler
{
    next?: RequestHandler;
    handle(request: WebsocketRequest): void;
}

class RequestHandlerSubscribe implements RequestHandler
{
    public next?: RequestHandler;
    private agent: WebsocketAgent;

    constructor(agent: WebsocketAgent)
    {
        this.agent = agent;
    }

    public handle(request: WebsocketRequest)
    {
        if(request.op !== "subscribe")
        {
            this.next?.handle(request);
            return;
        }

        if(request.args === undefined || !Array.isArray(request.args))
        {
            const responseMessage = <WebsocketResponse> {
                op: request.op,
                success: false,
                status: "missing op arguments",
                reqId: request.reqId,
            };

            this.agent.Socket.send(JSON.stringify(responseMessage));
            return;
        }

        let allTopicsValid = true;
        for(const topic of request.args)
        {
            if(!topics.has(topic))
            {
                allTopicsValid = false;
                break;
            }
        }

        if(!allTopicsValid)
        {
            const responseMessage = <WebsocketResponse> {
                op: request.op,
                success: false,
                status: "unknown topic(s)",
                reqId: request.reqId,
            };

            this.agent.Socket.send(JSON.stringify(responseMessage));
            return;
        }

        for(const topic of request.args)
        {
            const token = PubSub.subscribe(`${topic}.${this.agent.User.id}`, this.agent.subscriptionListener.bind(this.agent));
            this.agent.Subscriptions.set(topic, token);
        }

        const responseMessage = <WebsocketResponse> {
            op: request.op,
            success: true,
            status: "subscribed to topic(s)",
            reqId: request.reqId,
        };

        this.agent.Socket.send(JSON.stringify(responseMessage));
    }
}

class RequestHandlerUnsubscribe implements RequestHandler
{
    public next?: RequestHandler;
    private agent: WebsocketAgent;

    constructor(agent: WebsocketAgent)
    {
        this.agent = agent;
    }

    public handle(request: WebsocketRequest)
    {
        if(request.op !== "unsubscribe")
        {
            this.next?.handle(request);
            return;
        }

        if(request.args === undefined || !Array.isArray(request.args))
        {
            const responseMessage = <WebsocketResponse> {
                op: request.op,
                success: false,
                status: "missing op arguments",
                reqId: request.reqId,
            };

            this.agent.Socket.send(JSON.stringify(responseMessage));
            return;
        }

        let allTopicsValid = true;
        for(const topic of request.args)
        {
            if(!topics.has(topic))
            {
                allTopicsValid = false;
                break;
            }
        }

        if(!allTopicsValid)
        {
            const responseMessage = <WebsocketResponse> {
                op: request.op,
                success: false,
                status: "unknown topic(s)",
                reqId: request.reqId,
            };

            this.agent.Socket.send(JSON.stringify(responseMessage));
            return;
        }

        for(const topic of request.args)
        {
            const token = this.agent.Subscriptions.get(topic);
            if(token === undefined)
                continue;

            PubSub.unsubscribe(token);
            this.agent.Subscriptions.delete(topic);
        }

        const responseMessage = <WebsocketResponse> {
            op: request.op,
            success: true,
            status: "unsubscribed topic(s)",
            reqId: request.reqId,
        };

        this.agent.Socket.send(JSON.stringify(responseMessage));
    }
}

class RequestHandlerUnknown implements RequestHandler
{
    public next?: RequestHandler;
    private agent: WebsocketAgent;

    constructor(agent: WebsocketAgent)
    {
        this.agent = agent;
    }

    public handle(request: WebsocketRequest)
    {
        const responseMessage = <WebsocketResponse> {
            op: request.op,
            success: false,
            status: "unknown operation",
            reqId: request.reqId,
        };

        this.agent.Socket.send(JSON.stringify(responseMessage));
    }
}

export class WebsocketAgent extends EventEmitter<{
    "close": []
}>
{
    private connectionId: string;
    private socket: WebSocket;
    private user: Express.User;
    private requestHandlerChain: RequestHandler;
    private subscriptions: Map<string, string>;

    constructor(socket: WebSocket, user: Express.User)
    {
        super();
        this.connectionId = crypto.randomUUID();
        this.socket = socket;
        this.user = user;
        this.subscriptions = new Map();

        const requestHandlerSubscribe = new RequestHandlerSubscribe(this);
        const requestHandlerUnsubscribe = new RequestHandlerUnsubscribe(this);
        const requestHandlerUnknown = new RequestHandlerUnknown(this);

        requestHandlerSubscribe.next = requestHandlerUnsubscribe;
        requestHandlerUnsubscribe.next = requestHandlerUnknown;

        this.requestHandlerChain = requestHandlerSubscribe;

        this.socket.on("open", this.onOpen.bind(this));
        this.socket.on("close", this.onClose.bind(this));
        this.socket.on("error", this.onError.bind(this));
        this.socket.on("message", this.onMessage.bind(this));

        this.socket.send(JSON.stringify({
            status: "ready",
        }));
    }

    public shutdown()
    {
        this.socket.close();
    }

    public subscriptionListener(message: string, data?: any)
    {
        const subscriptionMessage = <SubscriptionMessage> {
            topic: message.split(".")[0],
            data,
        };

        this.socket.send(JSON.stringify(subscriptionMessage));
    }

    public get ConnectionId()
    {
        return this.connectionId;
    }

    public get Socket()
    {
        return this.socket;
    }

    public get User()
    {
        return this.user;
    }

    public get Subscriptions()
    {
        return this.subscriptions;
    }

    private onOpen()
    {

    }

    private onClose(code: number, reason: Buffer)
    {
        this.emit("close");
        for(const topic of topics.keys())
        {
            const token = this.subscriptions.get(topic);
            if(token === undefined)
                continue;

            PubSub.unsubscribe(token);
            this.subscriptions.delete(topic);
        }
    }

    private onError(err: Error)
    {

    }

    private onMessage(rawData: RawData, isBinary: boolean)
    {
        try
        {
            const data = rawData.toString();
            const message = JSON.parse(data);
            this.requestHandlerChain.handle(message);
        }
        catch(error)
        {
            console.error(error);
        }
    }
}