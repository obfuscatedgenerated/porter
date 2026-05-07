#!/usr/bin/env node

import {program} from "commander";

import {WebSocketServer} from "ws";

import {bind_port, close_socket, connect_to_remote, send_data_to_socket, unbind_all_ports, unbind_port} from "./tcp";
import type {
    BindMessage,
    CloseConnectionMessage,
    ConnectMessage,
    DataMessage,
    OutboundMessage,
    UnbindMessage
} from "./types";

const DEFAULT_ALLOWED_ORIGINS = [
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:3005",
    "https://ollieg.codes"
];

program
    .name("porter")
    .option("-p, --port <number>", "Port to run the WebSocket server on", "9000")
    .option("-h, --host <string>", "Host to expose ports on. This does not change the WebSocket server host (which is always local).", "127.0.0.1")
    .option("--disable-bind", "Disable the ability to bind ports, therefore allowing only outgoing connections")
    .option("--disable-connect", "Disable the ability to connect to remote hosts, therefore allowing only port binding")
    .option("--allowed-origins <origins...>", "List of allowed origins for incoming WebSocket connections, separated by a comma.", (value) => value.split(","), DEFAULT_ALLOWED_ORIGINS)

program.parse();

const {host, port, disableBind: disable_bind, disableConnect: disable_connect, allowedOrigins: allowed_origins} = program.opts();

if (host === "0.0.0.0" || host === "::") {
    console.warn("Warning: exposing ports to the public internet can be dangerous. Make sure you know what you're doing.");
}

const wss = new WebSocketServer({
    port: parseInt(port),
    verifyClient: (info, callback) => {
        if (info.origin) {
            if (!allowed_origins.includes(info.origin)) {
                console.warn(`Connection from disallowed origin: ${info.origin}`);
                callback(false, 1008, "Origin not allowed");
                return;
            }

            console.log(`Connection from origin: ${info.origin}`);
            callback(true);
        } else {
            console.warn("Connection without origin header");
            callback(false, 1008, "Origin header required");
        }
    }
});

wss.on("connection", (ws) => {
    console.log("New client connected");

    ws.on("message", (message) => {
        try {
            const base_msg = JSON.parse(message.toString());

            switch (base_msg.type) {
                case "bind_req":
                    if (disable_bind) {
                        console.warn("Bind request received but binding is disabled");
                        ws.send(JSON.stringify({
                            type: "ack_bind",
                            port: (base_msg as BindMessage).port,
                            success: false,
                            error: "Binding is disabled on this server"
                        } as OutboundMessage));
                        return;
                    }

                    const bind_msg = base_msg as BindMessage;
                    console.log(`Client requested to bind port ${bind_msg.port}`);

                    bind_port(bind_msg.port, ws);
                    break;
                case "unbind_req":
                    const unbind_msg = base_msg as UnbindMessage;
                    console.log(`Client requested to unbind port ${unbind_msg.port}`);

                    unbind_port(unbind_msg.port, ws);
                    break;
                case "data":
                    const data_msg = base_msg as DataMessage;
                    console.log(`Received data for socket ${data_msg.sock_id}`);

                    send_data_to_socket(data_msg.sock_id, data_msg.data);
                    break;
                case "close_connection":
                    const close_msg = base_msg as CloseConnectionMessage;
                    console.log(`Client requested to close connection ${close_msg.sock_id}`);

                    close_socket(close_msg.sock_id, ws);
                    break;
                case "connect_req":
                    if (disable_connect) {
                        console.warn("Connect request received but connecting is disabled");
                        ws.send(JSON.stringify({
                            type: "ack_connect",
                            sock_id: "", // sock_id is not known at this point, so we just send an empty string
                            success: false,
                            error: "Connections to arbitrary hosts are disabled on this server"
                        } as OutboundMessage));
                        return;
                    }

                    const connect_msg = base_msg as ConnectMessage;
                    console.log(`Client requested to connect to ${connect_msg.host}:${connect_msg.port}`);

                    connect_to_remote(connect_msg.host, connect_msg.port, ws, connect_msg.force_sock_id);
                    break;
                default:
                    console.warn(`Unknown message type: ${base_msg.type}`);
            }
        } catch (err) {
            console.error("Failed to handle message:", err);
        }
    });

    ws.on("close", () => {
        console.log("Client disconnected");
        unbind_all_ports(ws);
    });
});

console.log(`WebSocket server running on ws://127.0.0.1:${port}`);

// TODO: add udp support
