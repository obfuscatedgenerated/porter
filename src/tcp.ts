import {Server, Socket} from "net";
import {randomUUID} from "crypto";

import type {WebSocket} from "ws";
import type {OutboundMessage} from "./types";

const port_servers = new Map<number, Server>();
const sockets = new Map<string, Socket>();
const port_sockets = new Map<number, Set<string>>();

export const bind_port = (port: number, ws: WebSocket) => {
    if (port_servers.has(port)) {
        ws.send(JSON.stringify({
            type: "ack_bind",
            port,

            success: false,
            error: "Port is already bound"
        } as OutboundMessage));
        return;
    }

    const server = new Server((socket) => {
        const sock_id = randomUUID();
        sockets.set(sock_id, socket);

        if (!port_sockets.has(port)) {
            port_sockets.set(port, new Set());
        }

        port_sockets.get(port)!.add(sock_id);

        ws.send(JSON.stringify({
            type: "incoming_connection",
            port,
            sock_id
        } as OutboundMessage));

        socket.on("data", (data) => {
            ws.send(JSON.stringify({
                type: "data",
                sock_id,
                data: data.toString("base64")
            } as OutboundMessage));
        });

        socket.on("close", () => {
            sockets.delete(sock_id);
            ws.send(JSON.stringify({
                type: "connection_closing",
                port,
                sock_id
            } as OutboundMessage));
        });
    });

    server.listen(port, () => {
        console.log(`Port ${port} bound successfully`);
        ws.send(JSON.stringify({
            type: "ack_bind",
            port,
            success: true
        } as OutboundMessage));
    });

    server.on("error", (err) => {
        console.error(`Failed to bind port ${port}:`, err);
        ws.send(JSON.stringify({
            type: "ack_bind",
            port,
            success: false,
            error: err.message
        } as OutboundMessage));
    });

    port_servers.set(port, server);
}

export const unbind_port = (port: number, ws: WebSocket) => {
    const server = port_servers.get(port);
    if (!server) {
        ws.send(JSON.stringify({
            type: "ack_unbind",
            port,
            success: false,
            error: "Port is not bound"
        } as OutboundMessage));
        return;
    }

    // close all sockets associated with this port
    const sock_ids = port_sockets.get(port);
    if (sock_ids) {
        for (const sock_id of sock_ids) {
            close_socket(sock_id, ws);
        }
        port_sockets.delete(port);
    }

    server.close(() => {
        console.log(`Port ${port} unbound successfully`);
        ws.send(JSON.stringify({
            type: "ack_unbind",
            port,
            success: true
        } as OutboundMessage));
    });

    server.on("error", (err) => {
        console.error(`Failed to unbind port ${port}:`, err);
        ws.send(JSON.stringify({
            type: "ack_unbind",
            port,
            success: false,
            error: err.message
        } as OutboundMessage));
    });

    port_servers.delete(port);
}

export const unbind_all_ports = (ws: WebSocket) => {
    const ports = Array.from(port_servers.keys());
    for (const port of ports) {
        unbind_port(port, ws);
    }
}

export const send_data_to_socket = (sock_id: string, data: string) => {
    const socket = sockets.get(sock_id);
    if (!socket) {
        console.warn(`Connection ${sock_id} not found`);
        return;
    }

    socket.write(Buffer.from(data, "base64"));
}

export const close_socket = (sock_id: string, ws: WebSocket) => {
    const socket = sockets.get(sock_id);
    if (!socket) {
        ws.send(JSON.stringify({
            type: "ack_close_connection",
            sock_id,
            success: false,
            error: "Connection not found"
        } as OutboundMessage));
        return;
    }

    socket.end(() => {
        console.log(`Connection ${sock_id} closed successfully`);
        ws.send(JSON.stringify({
            type: "ack_close_connection",
            sock_id,
            success: true
        } as OutboundMessage));
    });

    socket.on("error", (err) => {
        console.error(`Failed to close connection ${sock_id}:`, err);
        ws.send(JSON.stringify({
            type: "ack_close_connection",
            sock_id,
            success: false,
            error: err.message
        } as OutboundMessage));
    });
}

export const connect_to_remote = (host: string, port: number, ws: WebSocket) => {
    const sock_id = randomUUID();
    const socket = new Socket();

    socket.connect(port, host, () => {
        sockets.set(sock_id, socket);
        console.log(`Outbound connection to ${host}:${port} established as ${sock_id}`);

        ws.send(JSON.stringify({
            type: "ack_connect",
            sock_id,
            success: true
        } as OutboundMessage));
    });

    socket.on("data", (data) => {
        ws.send(JSON.stringify({
            type: "data",
            sock_id,
            data: data.toString("base64")
        } as OutboundMessage));
    });

    socket.on("error", (err) => {
        console.error(`Outbound connection error for ${sock_id}:`, err);
        ws.send(JSON.stringify({
            type: "ack_connect",
            sock_id,
            success: false,
            error: err.message
        } as OutboundMessage));
    });

    socket.on("close", () => {
        sockets.delete(sock_id);
        ws.send(JSON.stringify({
            type: "connection_closing",
            sock_id
        } as OutboundMessage));
    });
};
