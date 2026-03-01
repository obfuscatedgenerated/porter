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

export type InboundMessage = BindMessage | UnbindMessage | DataMessage | CloseConnectionMessage;

export interface IncomingConnectionMessage extends BaseMessage {
    type: "incoming_connection";
    port: number;
    sock_id: string;
}

export interface ConnectionClosingMessage extends BaseMessage {
    type: "connection_closing";
    port: number;
    sock_id: string;
}

export interface AckBindMessage extends BaseMessage {
    type: "ack_bind";
    port: number;
    success: boolean;
    error?: string;
}

export interface AckUnbindMessage extends BaseMessage {
    type: "ack_unbind";
    port: number;
    success: boolean;
    error?: string;
}

export interface AckCloseConnectionMessage extends BaseMessage {
    type: "ack_close_connection";
    sock_id: string;
    success: boolean;
    error?: string;
}

export type OutboundMessage = IncomingConnectionMessage | ConnectionClosingMessage | AckBindMessage | AckUnbindMessage | DataMessage | AckCloseConnectionMessage;
