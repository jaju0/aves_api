import { WebSocket } from "ws";
import { WebsocketAgent } from "./WebsocketAgent.js";

export class WebsocketAgentProvider
{
    private agents: Map<string, WebsocketAgent>;

    constructor()
    {
        this.agents = new Map();
    }

    public shutdown()
    {
        for(const agent of this.agents.values())
            agent.shutdown();
    }

    public createAgent(socket: WebSocket, user: Express.User)
    {
        const agent = new WebsocketAgent(socket, user);
        agent.once("close", this.onAgentclose.bind(this, agent));
        this.agents.set(agent.ConnectionId, agent);
    }

    private onAgentclose(agent: WebsocketAgent)
    {
        this.agents.delete(agent.ConnectionId);
    }
}