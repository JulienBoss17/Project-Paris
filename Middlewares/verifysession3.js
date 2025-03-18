

function isAuthenticatedd() {
    return async (req, res, next) => {
        if (req.session && req.session.userId) {  
            return next();  
        } else {
            res.redirect("/compte");
        }
}
}

module.exports = isAuthenticatedd;