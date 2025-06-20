const fileInput = document.getElementById("fileInput");
const sessionIdInput = document.getElementById("sessionId");
const hostBtn = document.getElementById("hostBtn");
const joinBtn = document.getElementById("joinBtn");
const output = document.getElementById("output");
let conn;

const peerOptions = {
  //host: 'localhost',  pour tester en local
  host: '10.10.212.162',
  port: 9000,
  path: '/',
  key: 'monapp',
  secure: false
};

// Envoyeur : envoie un fichier
hostBtn.onclick = () => {
  const sessionId = sessionIdInput.value.trim();
  const file = fileInput.files[0];

  if (!sessionId || !file) {
    alert("Veuillez saisir un ID de session et choisir un fichier.");
    return;
  }

  const peer = new Peer(sessionId, peerOptions);

  peer.on("open", () => {
    output.innerHTML = `🟢 En attente de connexion...<br>ID de session : <strong>${sessionId}</strong>`;
  });

  peer.on("connection", (connection) => {
    output.innerHTML += "<br>🔗 Client connecté.";

    connection.on("open", () => {
      const reader = new FileReader();
      reader.onload = () => {
        const startTime = Date.now();

        const fileData = {
          filename: file.name,
          data: reader.result,
          timestamp: startTime
        };

        connection.send(fileData);
        output.innerHTML += `<br>📤 Fichier envoyé : <strong>${file.name}</strong>`;
      };

      reader.readAsArrayBuffer(file);
    });

    connection.on("error", (err) => {
      console.error("Erreur côté hôte :", err);
    });
  });
};

// Client : reçoit un fichier
joinBtn.onclick = () => {
  const sessionId = sessionIdInput.value.trim();
  if (!sessionId) return alert("Veuillez entrer un ID de session.");
  output.innerHTML = "🔌 Connexion au pair hôte...";

  const peer = new Peer(undefined, peerOptions);

  peer.on("open", () => {
    conn = peer.connect(sessionId);

    conn.on("open", () => {
      output.innerHTML += "<br>🟢 Connecté. Attente du fichier...";
    });

    conn.on("data", (file) => {
      console.log("📥 Fichier reçu :", file);

      if (file && file.data && file.filename) {
        const receiveTime = Date.now();
        const sendTime = file.timestamp;

        let durationMessage = "";
        if (typeof sendTime === "number") {
          const duration = receiveTime - sendTime;
          console.log(duration);
        }

        const arrayBuffer = file.data instanceof ArrayBuffer
          ? file.data
          : new Uint8Array(file.data).buffer;

        const blob = new Blob([arrayBuffer]);
        const url = URL.createObjectURL(blob);

        output.innerHTML += `<br>📄 Fichier reçu : <strong>${file.filename}</strong>`;        
        
        const link = document.createElement("a");
        link.href = url;
        link.download = file.filename;
        link.textContent = "⬇️ Télécharger le fichier";

        output.appendChild(document.createElement("br"));
        output.appendChild(link);
      } else {
        output.innerHTML += "<br>❌ Données reçues, mais le fichier est invalide.";
      }
    });

    conn.on("error", (err) => {
      console.error("Erreur côté client :", err);
    });
  });

  peer.on("error", (err) => {
    console.error("Erreur PeerJS globale :", err);
  });
};
