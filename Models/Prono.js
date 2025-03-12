const mongoose = require("mongoose");

const CommentaireSchema = new mongoose.Schema({
    contenu: String,          // Le contenu du commentaire
    auteur: String,           // L'auteur du commentaire
    date: { type: Date, default: Date.now }  // Date de publication du commentaire
});

const PronoSchema = new mongoose.Schema({
    match: String,
    date: Date,
    prediction: String,
    createdAt: { type: Date, default: Date.now }, // Stocke automatiquement la date et l'heure
    commentaires: [CommentaireSchema],  // Tableau de commentaires
    statut: { type: String, enum: ["en attente", "gagné", "perdu"], default: "en attente" }
});

module.exports = mongoose.model("Pronos", PronoSchema);
