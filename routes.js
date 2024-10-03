const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { createRoomWsServer } = require("./app-ws");

const prisma = new PrismaClient();
const router = express.Router();

// Criar uma sala
router.post("/rooms", async (req, res) => {
  const { roomName, userIds } = req.body;

  if (!roomName || !userIds || !Array.isArray(userIds)) {
    return res
      .status(400)
      .json({ message: "Room name and user IDs are required" });
  }

  try {
    const newRoom = await prisma.room.create({
      data: {
        name: roomName,
        users: {
          connect: userIds.map((id) => ({ id })),
        },
      },
    });

    // Cria um WebSocket Server para essa sala
    createRoomWsServer(req.app.get("server"), newRoom.id);

    res.status(201).json(newRoom);
  } catch (error) {
    console.error("Erro ao criar a sala:", error);
    res
      .status(500)
      .json({ message: "Error creating room", error: error.message });
  }
});

// Enviar uma mensagem para uma sala
router.post("/rooms/:roomId/messages", async (req, res) => {
  const { roomId } = req.params;
  const { content, userId } = req.body;

  if (!content || !userId) {
    return res
      .status(400)
      .json({ message: "Message content and user ID are required" });
  }

  try {
    const roomExists = await prisma.room.findUnique({
      where: { id: parseInt(roomId) },
    });

    if (!roomExists) {
      return res.status(404).json({ message: "Room not found" });
    }

    const newMessage = await prisma.message.create({
      data: {
        content,
        userId,
        roomId: parseInt(roomId),
      },
    });

    // Broadcast via WebSocket (se disponível)
    if (req.app.get("wss")) {
      const wss = req.app.get("wss");
      wss.broadcast({ roomId, newMessage });
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error sending message" });
  }
});

// Listar mensagens de uma sala
router.get("/rooms/:roomId/messages", async (req, res) => {
  const { roomId } = req.params;

  try {
    const messages = await prisma.message.findMany({
      where: { roomId: parseInt(roomId) },
      include: { user: true },
    });

    res.status(200).json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching messages" });
  }
});

// Criar um novo usuário
router.post("/users", async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: "User name is required" });
  }

  try {
    const newUser = await prisma.user.create({
      data: { name },
    });

    res.status(201).json(newUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating user" });
  }
});

// Listar todos os usuários
router.get("/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany();

    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching users" });
  }
});

// Listar todas as salas de um usuário
router.get("/users/:userId/rooms", async (req, res) => {
  const { userId } = req.params;

  try {
    const userRooms = await prisma.room.findMany({
      where: {
        users: {
          some: { id: parseInt(userId) },
        },
      },
    });

    res.status(200).json(userRooms);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching user rooms" });
  }
});

module.exports = router;
