const WebSocket = require("ws");

const roomWebSockets = new Map(); // Mapeia roomId para WebSocket Servers
const clientSockets = new Map(); // Mapeia roomId para arrays de WebSockets de clientes

function onError(ws, err) {
  console.error(`onError: ${err.message}`);
}

function onMessage(ws, data) {
  const message = JSON.parse(data);
  const { roomId, content } = message;

  // Broadcast the message to all clients in the room
  if (clientSockets.has(roomId)) {
    const clients = clientSockets.get(roomId);
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ roomId, content }));
      }
    });
  }
}

function onConnection(ws, req, roomId) {
  if (!clientSockets.has(roomId)) {
    clientSockets.set(roomId, []);
  }

  clientSockets.get(roomId).push(ws);

  ws.on("message", (data) => {
    try {
      const parsedData = JSON.parse(data); // Tente fazer o parse da mensagem

      // Aqui você pode usar parsedData.message
      console.log("Mensagem recebida:", parsedData.message);

      // Enviar uma resposta, se necessário
      ws.send(`Mensagem recebida: ${parsedData.message}`);
    } catch (error) {
      console.error("Erro ao processar a mensagem:", error);
      // Você pode enviar uma mensagem de erro de volta para o cliente, se desejar
      ws.send('Formato de mensagem inválido. Use {"message": "sua mensagem"}');
    }
  });
  ws.on("error", (error) => onError(ws, error));
  ws.on("close", () => {
    clientSockets.get(roomId).filter((client) => client !== ws);
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
