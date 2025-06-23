const { io } = require("socket.io-client");

const TOTAL_CLIENTS = 10;
const SERVER_URL = "https://localhost"; // ← replace with your server
const clients = [];

let completed = 0;
let totalTime = 0;

for (let i = 0; i < TOTAL_CLIENTS; i++) {
  const socket = io(SERVER_URL, {
    transports: ["websocket"],
    rejectUnauthorized: false
  });

  let startTime = null;

  socket.on("connect", () => {
    console.log(`✅ Client ${i} prêt à recevoir`);
  });

  socket.on("offer", (offer) => {
    startTime = Date.now();

    const fakeAnswer = {
      type: "answer",
      sdp: "placeholder SDP",
      offerTimestamp: offer.timestamp || null
    };

    socket.emit("answer", fakeAnswer);
  });

  socket.on("transfer-complete", () => {
    const duration = Date.now() - startTime;
    totalTime += duration;
    completed++;

    console.log(`📥 Client ${i} a reçu le fichier en ${duration} ms`);

    socket.disconnect();

    if (completed === TOTAL_CLIENTS) {
      const average = Math.round(totalTime / TOTAL_CLIENTS);
      console.log(`\n📊 Transfert terminé pour ${TOTAL_CLIENTS} clients`);
      console.log(`📈 Temps moyen de téléchargement : ${average} ms`);
    }
  });

  socket.on("connect_error", (err) => {
    console.error(`❌ Client ${i} erreur : ${err.message}`);
  });

  clients.push(socket);
}
