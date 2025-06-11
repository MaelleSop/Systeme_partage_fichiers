const fileInput = document.getElementById("fileInput");
const sessionIdInput = document.getElementById("sessionId");
const hostBtn = document.getElementById("hostBtn");
const joinBtn = document.getElementById("joinBtn");
const output = document.getElementById("output");

let conn; // connexion P2P

// Hébergeur : initie l'envoi
hostBtn.onclick = () => {
  const sessionId = sessionIdInput.value.trim();
  const file = fileInput.files[0];
  if (!sessionId || !file) return alert("Veuillez remplir l'ID de session et choisir un fichier.");

  const peer = new Peer(sessionId); // l’ID du peer = nom de session

  peer.on("open", () => {
    output.innerHTML = `En attente de connexion...<br>ID de session : <strong>${sessionId}</strong>`;
  });

  peer.on("connection", (connection) => {
    conn = connection;
    output.innerHTML += "<br>Receveur connecté, envoi du fichier...";

    const reader = new FileReader();
    reader.onload = () => {
      conn.send({
        filename: file.name,
        data: reader.result
      });
      output.innerHTML += "<br>✅ Fichier envoyé.";
    };
    reader.readAsArrayBuffer(file);
  });
};

// Client : se connecte à l’hébergeur
joinBtn.onclick = () => {
  const sessionId = sessionIdInput.value.trim();
  if (!sessionId) return alert("Veuillez entrer l'ID de session du fichier à recevoir.");

  const peer = new Peer();
  peer.on("open", (id) => {
    conn = peer.connect(sessionId);

    conn.on("open", () => {
      output.innerHTML = "✅ Connecté. Attente du fichier...";
    });

    conn.on("data", (file) => {
      output.innerHTML += `<br>📄 Fichier reçu : <strong>${file.filename}</strong>`;
      const blob = new Blob([file.data]);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.filename;
      link.textContent = "⬇️ Télécharger le fichier";
      output.appendChild(document.createElement("br"));
      output.appendChild(link);
    });
  });
};
