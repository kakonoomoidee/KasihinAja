require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const WebSocket = require("ws");
const db = require("./models");
const apiRoutes = require("./routes/api");
const { listenToEVM } = require("./utils/evmListener");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.locals.wss = wss;

app.use(cors());
app.use(express.json());

app.use("/api", apiRoutes);

/**
 * Handles incoming WebSocket connections from OBS clients and assigns them to a streamer room.
 *
 * @param {object} ws The WebSocket client instance.
 * @param {object} req The incoming HTTP upgrade request.
 * @returns {void}
 */
const handleWsConnection = (ws, req) => {
  const urlParams = new URLSearchParams(req.url.split("?")[1]);
  const streamerAddress = urlParams.get("streamer");
  
  if (streamerAddress) {
    ws.streamerRoom = streamerAddress.toLowerCase();
  }
};

wss.on("connection", handleWsConnection);

/**
 * Bootstraps the database, EVM listeners, and HTTP server.
 *
 * @returns {Promise<void>}
 */
const startServer = async () => {
  try {
    await db.sequelize.authenticate();
    
    listenToEVM(wss);

    const port = process.env.PORT || 3000;
    server.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

startServer();
