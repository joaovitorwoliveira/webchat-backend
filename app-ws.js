const WebSocket = require("ws");

const roomWebSockets = new Map();
const clientSockets = new Map();

function onError(ws, err) {
  console.error(`onError: ${err.message}`);
}

function onConnection(ws, req, roomId) {
  if (!clientSockets.has(roomId)) {
    clientSockets.set(roomId, []);
  }

  const roomClients = clientSockets.get(roomId);
  roomClients.push(ws);

  ws.on("message", (data) => {
    try {
      const parsedData = JSON.parse(data);
      console.log("Mensagem recebida:", parsedData.message);

      // Envia a mensagem para todos os clientes conectados na sala
      roomClients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(
            JSON.stringify({
              from: parsedData.sender,
              message: parsedData.message,
            })
          );
        }
      });

      ws.send(JSON.stringify({ from: "Você", message: parsedData.message }));
    } catch (error) {
      console.error("Erro ao processar a mensagem:", error);
      ws.send('Formato de mensagem inválido. Use {"message": "sua mensagem"}');
    }
  });

  ws.on("error", (error) => onError(ws, error));
  ws.on("close", () => {
    const filteredClients = roomClients.filter((client) => client !== ws);
    clientSockets.set(roomId, filteredClients);
  });

  console.log(`Conectado ao servidor WebSocket na sala ${roomId}!`);
}

function createRoomWsServer(server, roomId) {
  const wss = new WebSocket.Server({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    const pathname = new URL(request.url, `http://${request.headers.host}`)
      .pathname;

    if (pathname === `/room/${roomId}`) {
      wss.handleUpgrade(request, socket, head, (ws) => {
        onConnection(ws, request, roomId);
      });
    } else {
      socket.destroy();
    }
  });
  roomWebSockets.set(roomId, wss);
  console.log(`WebSocket Server criado para a sala ${roomId}`);
}

module.exports = {
  createRoomWsServer,
  clientSockets,
};
