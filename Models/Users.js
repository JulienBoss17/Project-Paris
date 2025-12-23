const mongoose = require("mongoose");

// définir un modèle
const UserSchema = mongoose.Schema({
    prenom: {type: String},
    nom: {type: String},
    password: {type: String},
    role: {type: String, enum: ['admin', 'user'], default: 'user'},
    status: {
      type: String,
      enum: ['Connecté', 'Non connecté'], 
      default: 'Non connecté'
    },
})

const User = mongoose.model('users', UserSchema)

module.exports = User

