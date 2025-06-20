const fs = require("fs");
const https = require("https");
const express = require("express");
const socketIo = require("socket.io");
const path = require("path");

const app = express();
const PORT = 443;

// SSL certificate and key
const sslOptions = {
  key: fs.readFileSync(path.join(__dirname, "server.key")),
  cert: fs.readFileSync(path.join(__dirname, "server.cert"))
};

app.use(express.static(path.join(__dirname, "html")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "html", "index.html"));
});

const server = https.createServer(sslOptions, app);
const io = socketIo(server);

io.on("connection", (socket) => {
  console.log(`📡 New peer connected at ${new Date().toISOString()}`);

  // Track transfer times per socket ID
  let transferStart = null;

  socket.on("offer", (data) => {
    const timestamp = Date.now();
    transferStart = timestamp;
    data.timestamp = timestamp;
    console.log(`🚀 Offer sent at ${new Date(timestamp).toISOString()}`);
    socket.broadcast.emit("offer", data);
  });

  socket.on("answer", (data) => {
    const now = Date.now();
    const offerTime = data.offerTimestamp;
    const delay = offerTime ? `${now - offerTime} ms` : "N/A";
    console.log(`✅ Answer received at ${new Date(now).toISOString()} (delay: ${delay})`);
    socket.broadcast.emit("answer", data);
  });

  socket.on("ice-candidate", (data) => {
    socket.broadcast.emit("ice-candidate", data);
  });

  // Optional: track file transfer completion via special signal
  socket.on("transfer-complete", () => {
    const end = Date.now();
    if (transferStart) {
      const total = end - transferStart;
      console.log(`📦 File transfer completed at ${new Date(end).toISOString()} (duration: ${total} ms)`);
    } else {
      console.log(`📦 File transfer complete, but start time unknown`);
    }
  });

  socket.on("disconnect", () => {
    console.log(`❌ Peer disconnected at ${new Date().toISOString()}`);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🔒 HTTPS server running at https://<your-public-ip-or-domain>`);
});
