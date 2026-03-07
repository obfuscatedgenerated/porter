interface BaseMessage {
    type: string;
}

export interface BindMessage extends BaseMessage {
    type: "bind_req";
    port: number;
}

export interface UnbindMessage extends BaseMessage {
    type: "unbind_req";
    port: number;
}

export interface DataMessage extends BaseMessage {
    type: "data";
    sock_id: string;
    data: string; // base 64
}

export interface CloseConnectionMessage extends BaseMessage {
    type: "close_connection";
    sock_id: string;
}

export interface ConnectMessage extends BaseMessage {
    type: "connect_req";
    host: string;
    port: number;
    force_sock_id?: string;
}

export type InboundMessage = BindMessage | UnbindMessage | DataMessage | CloseConnectionMessage | ConnectMessage;

export interface IncomingConnectionMessage extends BaseMessage {
    type: "incoming_connection";
    port: number;
    sock_id: string;
}

export interface ConnectionClosingMessage extends BaseMessage {
    type: "connection_closing";
    port?: number;
    sock_id: string;
}

interface AckMessage extends BaseMessage {
    success: boolean;
    error?: string;
}

export interface AckBindMessage extends AckMessage {
    type: "ack_bind";
    port: number;
}

export interface AckUnbindMessage extends AckMessage {
    type: "ack_unbind";
    port: number;
}

export interface AckCloseConnectionMessage extends AckMessage {
    type: "ack_close_connection";
    sock_id: string;
}

export interface AckConnectMessage extends AckMessage {
    type: "ack_connect";
    sock_id: string;
}

export type OutboundMessage = IncomingConnectionMessage | ConnectionClosingMessage | AckBindMessage | AckUnbindMessage | DataMessage | AckCloseConnectionMessage | AckConnectMessage;
