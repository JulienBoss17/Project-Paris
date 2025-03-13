const mongoose = require("mongoose");

const CommentaireSchema = new mongoose.Schema({
    contenu: String,          // Le contenu du commentaire
    auteur: String,           // L'auteur du commentaire
    date: { type: Date, default: Date.now }  // Date de publication du commentaire
});

const MatchSchema = new mongoose.Schema({
    equipeDomicile: { type: String, required: true, trim: true },
    equipeExterieur: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    typePrediction: { 
        type: String, 
        enum: ["Score Exact", "Buteur", "1X2", "Handicap"], 
        required: true 
    },
    prediction: { type: String, required: true, trim: true },
    cote: { type: Number, required: true, min: 1 }
});

const PronoSchema = new mongoose.Schema({
    matchs: { type: [MatchSchema], required: true }, 
    date: { type: Date, required: true },
    typePari: { type: String, enum: ["Simple", "Combiné"], required: true },
    createdAt: { type: Date, default: Date.now },
    commentaires: [CommentaireSchema],  
    cote: { type: Number, required: true, min: 1, default: 1 },  // 👈 Valeur par défaut si absent
    statut: { type: String, enum: ["En Attente", "Gagné", "Perdu"], default: "En Attente" }
});


module.exports = mongoose.model("Pronos", PronoSchema);


