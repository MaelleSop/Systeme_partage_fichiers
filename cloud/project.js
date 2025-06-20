// Importation des modules 
const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const dotenv = require('dotenv');

// Chargement des variables d'environnement 
dotenv.config();

console.log("Chemin clé JSON:", process.env.GOOGLE_APPLICATION_CREDENTIALS);
console.log("Nom bucket:", process.env.GCS_BUCKET_NAME);

// Création de l'application serveur 
const app = express();

// Connexionn à Google Cloud Storage 
const { Storage } = require('@google-cloud/storage');
const storage = new Storage({
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});
const bucket = storage.bucket(process.env.GCS_BUCKET_NAME);

// Utilisation du HTML
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "interface_web_cloud.html"));
});

// Test du serveur
/*app.get("/", (req, res) => {
    res.send("Le serveur fonctionne !");
  });*/


// Configuration de multer
const multerStorage = multer.memoryStorage();
const upload = multer({ storage: multerStorage });



// Endpoint POST /upload
app.post('/upload', upload.single('file'), async (req, res) => {
     
    if (!req.file) return res.status(400).json({ error: "Aucun fichier reçu" });

    // Initialisation pour le calcul de latence
    const start = Date.now();

    // Création du nom de fichier et préparation d'un flux pour l'envoi du fichier vers GCS
    const filename = uuidv4() + path.extname(req.file.originalname);
    const blob = bucket.file(filename);
    const blobStream = blob.createWriteStream({
        resumable: false,
        contentType: req.file.mimetype
    });

    // Gestion des erreurs d'envoi
    blobStream.on('error', err => {
        console.error('Erreur upload vers GCS:', err);
        res.status(500).json({ error: 'Erreur lors de l\'envoi vers GCS', details: err.message });
    });

    //Génération de l'URL de téléchargement temporaire 
    blobStream.on('finish', async () => {
        const [url] = await blob.getSignedUrl({
            version: 'v4',
            action: 'read',
            expires: Date.now() + 15 * 60 * 1000, // URL valide pendant 15 min
            responseDisposition: `attachment; filename="${filename}"`,
          });

        // Fin du calcul de latence
        const latency = Date.now() - start;
        console.log("Latence (ms):", latency);

        res.json({ downloadUrl: url });
    });

    // Envoi du fichier vers GCS
    blobStream.end(req.file.buffer)
});



// Démarrer le serveur 
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serveur en écoute sur http://localhost:${PORT}`);
});

