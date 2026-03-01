import WebSocket from "ws";

const ws = new WebSocket("ws://127.0.0.1:9000", {origin: "http://localhost"});

ws.on("open", () => {
    console.log("Connected to porter");
    ws.send(JSON.stringify({ type: "bind_req", port: 8080 }));
});

const HTTP_RESPONSE = `HTTP/1.1 200 OK
Content-Type: text/html

<html>
<head><title>Porter Test</title></head>
<body>
<h1>Hello from Porter!</h1>
<p>This is a test response.</p>
</body>
</html>
`.replaceAll("\n", "\r\n");

ws.on("message", (data) => {
    const msg = JSON.parse(data);
    console.log("Message from Porter:", msg);

    if (msg.type === "incoming_connection") {
        console.log(`New user connected with ID: ${msg.sock_id}`);
        
        const http_data = Buffer.from(HTTP_RESPONSE).toString("base64");

        ws.send(JSON.stringify({
            type: "data",
            sock_id: msg.sock_id,
            data: http_data
        }));

        ws.send(JSON.stringify({
            type: "close_connection",
            sock_id: msg.sock_id
        }));
    }
});