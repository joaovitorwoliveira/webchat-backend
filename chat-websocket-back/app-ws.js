const WebSocket = require("ws");

const roomWebSockets = new Map();
const clientSockets = new Map();

function onError(ws, err) {
  console.error(`onError: ${err.message}`);
}

function broadcastMessage(roomId, sender, message) {
  clientSockets.get(roomId).forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      if (client === sender) {
        client.send(`Você: ${message}`);
      } else {
        client.send(`${sender.userName}: ${message}`);
      }
    }
  });
}

function handleDisconnect(ws, roomId) {
  clientSockets.set(
    roomId,
    clientSockets.get(roomId).filter((client) => client !== ws)
  );

  clientSockets.get(roomId).forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(`${ws.userName || "Usuário desconhecido"} se desconectou`);
    }
  });

  console.log(
    `${ws.userName || "Usuário desconhecido"} se desconectou da sala ${roomId}`
  );
}

function handleMessage(ws, roomId, data) {
  try {
    const parsedData = JSON.parse(data);
    const { message } = parsedData;

    broadcastMessage(roomId, ws, message);
  } catch (error) {
    console.error("Erro ao processar a mensagem:", error);
    ws.send(
      'Formato de mensagem inválido. Use {"userName": "seu nome", "message": "sua mensagem"}'
    );
  }
}

function onConnection(ws, req, roomId) {
  const urlParams = new URLSearchParams(req.url.split("?")[1]);
  const userName = urlParams.get("userName") || "Usuário desconhecido";

  ws.userName = userName;

  console.log(`Novo usuário conectado: ${userName} na sala ${roomId}`);

  if (!clientSockets.has(roomId)) {
    clientSockets.set(roomId, []);
  }

  clientSockets.get(roomId).push(ws);

  clientSockets.get(roomId).forEach((client) => {
    if (client !== ws && client.readyState === WebSocket.OPEN) {
      client.send(`${userName} entrou na sala`);
    }
  });

  ws.on("message", (data) => handleMessage(ws, roomId, data));
  ws.on("error", (error) => onError(ws, error));
  ws.on("close", () => handleDisconnect(ws, roomId));
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
