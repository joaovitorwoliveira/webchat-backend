const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const roomRoutes = require("./routes");

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(helmet());
app.use(express.json());
app.use(morgan("dev"));

app.use("/api", roomRoutes);

module.exports = app;
