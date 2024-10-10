const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { createRoomWsServer } = require("./app-ws");

const prisma = new PrismaClient();
const router = express.Router();

const parseRoomId = (id) => {
  const parsedId = parseInt(id, 10);
  if (isNaN(parsedId)) {
    throw new Error("Invalid room ID");
  }
  return parsedId;
};

router.post("/rooms", async (req, res) => {
  const { roomName, userName } = req.body;

  if (!roomName || !userName) {
    return res
      .status(400)
      .json({ message: "Room name and user name are required" });
  }

  try {
    const newUser = await prisma.user.create({
      data: { name: userName },
    });

    const newRoom = await prisma.room.create({
      data: {
        name: roomName,
        users: {
          connect: [{ id: newUser.id }],
        },
      },
    });

    createRoomWsServer(req.app.get("server"), newRoom.id);

    res
      .status(201)
      .json({ roomId: newRoom.id, userId: newUser.id, token: "123456" });
  } catch (error) {
    console.error("Erro ao criar a sala:", error);
    res
      .status(500)
      .json({ message: "Error creating room", error: error.message });
  }
});

router.post("/rooms/:roomId/join", async (req, res) => {
  const { roomId } = req.params;
  const { userName } = req.body;

  if (!userName) {
    return res.status(400).json({ message: "User name is required" });
  }

  try {
    const parsedRoomId = parseRoomId(roomId);

    const roomExists = await prisma.room.findUnique({
      where: { id: parsedRoomId },
    });

    if (!roomExists) {
      return res.status(404).json({ message: "Room not found" });
    }

    const newUser = await prisma.user.create({
      data: { name: userName },
    });

    await prisma.room.update({
      where: { id: parsedRoomId },
      data: {
        users: {
          connect: [{ id: newUser.id }],
        },
      },
    });

    res.status(200).json({ roomId: roomExists.id, userId: newUser.id });
  } catch (error) {
    console.error("Erro ao entrar na sala:", error);
    res
      .status(500)
      .json({ message: "Error joining room", error: error.message });
  }
});

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

router.get("/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching users" });
  }
});

module.exports = router;
