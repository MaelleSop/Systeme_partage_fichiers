// Création du serveur Express 
const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const dotenv = require('dotenv');
dotenv.config();

console.log("Chemin clé JSON:", process.env.GOOGLE_APPLICATION_CREDENTIALS);
console.log("Nom bucket:", process.env.GCS_BUCKET_NAME);

const app = express();

const { Storage } = require('@google-cloud/storage');
const storage = new Storage({
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});
const bucket = storage.bucket(process.env.GCS_BUCKET_NAME);

// Utilisation du HTML
//app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "interface_web_cloud.html"));
});



// Test du serveur
/*app.get("/", (req, res) => {
    res.send("Le serveur fonctionne !");
  });*/


// Multer setup
const multerStorage = multer.memoryStorage();
const upload = multer({ storage: multerStorage });

// Uploads endpoints 
app.post('/upload', upload.single('file'), async (req, res) => {

    if (!req.file) return res.status(400).json({ error: "Aucun fichier reçu" });

    const filename = uuidv4() + path.extname(req.file.originalname);
    const blob = bucket.file(filename);
    const blobStream = blob.createWriteStream({
        resumable: false,
        contentType: req.file.mimetype

    });

    blobStream.on('error', err => {
        console.error('Erreur upload vers GCS:', err);
        res.status(500).json({ error: 'Erreur lors de l\'envoi vers GCS', details: err.message });
    });

    blobStream.on('finish', async () => {
        const [url] = await blob.getSignedUrl({
            version: 'v4',
            action: 'read',
            expires: Date.now() + 15 * 60 * 1000, // URL valide pendant 15 min
            responseDisposition: `attachment; filename="${filename}"`,
          });
          res.json({ downloadUrl: url });
    });

    blobStream.end(req.file.buffer)
});

// Démarrer le serveur 
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serveur en écoute sur http://localhost:${PORT}`);
});

