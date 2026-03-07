# porter

Expose ports and connect to remotes over TCP from the browser via a WebSocket bridge.

```
Usage: porter [options]

Options:
  -p, --port <number>             Port to run the WebSocket server on (default: "9000")
  -h, --host <string>             Host to expose ports on. This does not change the WebSocket server host (which is always local). (default: "127.0.0.1")
  --disable-bind                  Disable the ability to bind ports, therefore allowing only outgoing connections
  --disable-connect               Disable the ability to connect to remote hosts, therefore allowing only port binding
  --allowed-origins <origins...>  List of allowed origins for incoming WebSocket connections, separated by a comma. (default: ["http://localhost","http://localhost:3000","http://localhost:3005","https://ollieg.codes"])
  --help                          display help for command

```
