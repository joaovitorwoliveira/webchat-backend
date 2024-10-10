const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const roomRoutes = require("./routes");

const app = express();

app.use(cors({ origin: "http://localhost:5173" }));
app.use(helmet());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Servidor Express está funcionando!");
});

app.use("/api", roomRoutes);

module.exports = app;
