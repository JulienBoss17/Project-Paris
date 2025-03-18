

function isAuthenticated() {
    return async (req, res, next) => {
    if (req.session.userId) {
        if (req.session && req.session.userId) {  
            return next();  
        } else {
            res.redirect("/compte");
        }
    } else {
        res.redirect("/")
    }
}
}

module.exports = isAuthenticated;
