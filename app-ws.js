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

  clientSockets.get(roomId).push(ws);

  ws.on("message", (data) => {
    try {
      const parsedData = JSON.parse(data);
      const { userName, message } = parsedData;

      console.log(`Mensagem recebida de ${userName}: ${message}`);

      clientSockets.get(roomId).forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(`${userName}: ${message}`);
        }
      });

      ws.send(`Você: ${message}`);
    } catch (error) {
      console.error("Erro ao processar a mensagem:", error);
      ws.send(
        'Formato de mensagem inválido. Use {"userName": "seu nome", "message": "sua mensagem"}'
      );
    }
  });

  ws.on("error", (error) => onError(ws, error));
  ws.on("close", () => {
    clientSockets.set(
      roomId,
      clientSockets.get(roomId).filter((client) => client !== ws)
    );
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
