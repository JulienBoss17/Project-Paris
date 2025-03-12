function isAuthenticated(req, res, next) {
    // Vérifie si l'utilisateur est connecté via la session
    if (req.session && req.session.userId) {  // Assure-toi que l'ID de l'utilisateur est stocké dans la session
        return next();  // L'utilisateur est connecté, on passe à la route suivante
    } else {
        // Si l'utilisateur n'est pas connecté, on renvoie une erreur ou on redirige vers la page de connexion
        res.redirect("/compte");
    }
}

module.exports = isAuthenticated;
