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
 * Also relays SUBATHON_SYNC messages from the dashboard to all overlay clients in the same room.
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

  ws.on("message", (raw) => {
    try {
      const data = JSON.parse(raw.toString());
      if (data.type === "SUBATHON_SYNC" && ws.streamerRoom) {
        console.log(`Subathon [SYNC] | room=${ws.streamerRoom} | active=${data.payload?.isActive} | remaining=${data.payload?.remaining}`);
        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN && client.streamerRoom === ws.streamerRoom) {
            client.send(JSON.stringify({
              type: "SUBATHON_UPDATE",
              payload: data.payload,
            }));
          }
        });
      }
    } catch {
      // Non-fatal: malformed message ignored.
    }
  });
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
