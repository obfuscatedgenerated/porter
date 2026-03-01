import {program} from "commander";

import {WebSocketServer} from "ws";

import {bind_port, close_socket, send_data_to_socket, unbind_all_ports, unbind_port} from "./tcp";
import type {BindMessage, CloseConnectionMessage, DataMessage, UnbindMessage} from "./types";

program
    .name("porter")
    .option("-p, --port <number>", "Port to run the WebSocket server on", "9000")
    .option("-h, --host <string>", "Host to expose ports on. This does not change the WebSocket server host (which is always local).", "127.0.0.1");

program.parse();

const {host, port} = program.opts();

if (host === "0.0.0.0" || host === "::") {
    console.warn("Warning: exposing ports to the public internet can be dangerous. Make sure you know what you're doing.");
}

const ALLOWED_ORIGINS = [
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:3005",
    "https://ollieg.codes"
];

const wss = new WebSocketServer({
    port: parseInt(port),
    verifyClient: (info, callback) => {
        if (info.origin) {
            if (!ALLOWED_ORIGINS.includes(info.origin)) {
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
