const http = require("http");

const { createRoomWsServer } = require("./app-ws");
const app = require("./app");

const server = http.createServer(app);
app.set("server", server);

app.get("/", (req, res) => {
  res.send("Servidor Express está funcionando!");
});

// const roomId = 11;
// createRoomWsServer(server, roomId);

server.listen(3000, () => {
  console.log("App Express is running on http://localhost:3000");
});
