const express = require("express");
const http = require("http");
const { createRoomWsServer } = require("./app-ws");
const app = require("./app");

const server = http.createServer(app);

// Middleware ou outras configurações do Express podem ser adicionados aqui
app.get("/", (req, res) => {
  res.send("Servidor Express está funcionando!");
});

const roomId = 11;
createRoomWsServer(server, roomId);

server.listen(3000, () => {
  console.log("App Express is running on http://localhost:3000");
});
