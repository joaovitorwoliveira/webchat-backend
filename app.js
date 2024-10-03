const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const routes = require("./routes");

const app = express();

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(helmet());
app.use(express.json());
app.use(morgan("dev"));

// Rota de login (mock)
app.post("/login", (req, res) => {
  res.json({ token: "123456" });
});

// Usar rotas criadas no arquivo routes.js
app.use("/api", routes);

module.exports = app;
