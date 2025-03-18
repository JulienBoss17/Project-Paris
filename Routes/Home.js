const express = require("express");
const router = express.Router();
const Prono = require("../Models/Prono");
const User = require("../Models/Users");
const bcrypt = require("bcryptjs");
const Annonce = require("../Models/Annonces");

const verifySession = require("../Middlewares/verifysession");
const isAuthenticated = require("../Middlewares/verifysession2");

// 📝 Afficher tous les pronos
router.get("/", async (req, res) => {

    const annonces = await Annonce.find().populate("userId", "nom role prenom");

    const pronostics = await Prono.find().sort({ createdAt: -1 }); // Trier par date de création (plus récents en premier)


    // Séparer les pronostics "en attente" et ceux qui sont "gagné" ou "perdu"
    let enAttente = pronostics.filter(prono => prono.statut === "En Attente");
    let termines = pronostics.filter(prono => prono.statut !== "En Attente");

    const totalPronostics = pronostics.length - enAttente.length;
    const pronosticsGagnes = pronostics.filter(prono => prono.statut === 'Gagné').length;
    const pronosticsPerdus = pronostics.filter(prono => prono.statut === 'Perdu').length;

    const ratio = totalPronostics > 0 ? (pronosticsGagnes / totalPronostics) * 100 : 0;

    const User = req.session.user;
    res.render("pronos", { pronosEnAttente: enAttente, pronosTermines: termines, User, pronos: pronostics, totalPronostics, pronosticsGagnes, pronosticsPerdus, ratio: ratio.toFixed(2), annonces}) // Arrondir le ratio à 2 décimales });
})

router.get("/compte", async (req, res) => {
    const users = await User.find().sort({ nom: 1 });
    res.render("compte", { users, message: req.flash() } );
});

router.post('/annonces/:userId', verifySession("admin"), async (req, res) => {

    const userId = req.params.userId; 
    const { titre, description, dateAnnonce } = req.body; 

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }

        await Annonce.deleteMany()

        const newAnnonce = new Annonce({
            userId,
            titre,
            description,
            dateAnnonce
        });

        await newAnnonce.save();

        req.flash("success", "Annonce enregistrée avec succès !");
        res.redirect("/");

    } catch (err) {
        console.error('Erreur lors de l’enregistrement de l’annonce:', err.message);
        res.status(500).json({ message: "Erreur serveur" });
    }
});

// ➕ Ajouter un prono (formulaire)
router.get("/ajouter", verifySession("admin"),(req, res) => {
    res.render("ajouter-prono");
});

router.post("/ajouter", verifySession("admin"),async (req, res) => {
    console.log("Données reçues:", JSON.stringify(req.body, null, 2)); // 🔍 Voir ce qui est reçu

    try {
        let matchs = Array.isArray(req.body.matchs) ? req.body.matchs : [req.body.matchs];

        const nouveauProno = new Prono({
            matchs: matchs.map(match => ({
                equipeDomicile: match.equipeDomicile,
                equipeExterieur: match.equipeExterieur,
                date: new Date(match.date), // Convertir en Date
                typePrediction: match.typePrediction,
                prediction: match.prediction,
                cote: parseFloat(match.cote) // Convertir en Number
            })),
            date: new Date(req.body.date), // Convertir en Date
            typePari: req.body.typePari,
            cote: parseFloat(req.body.cote), // Convertir en Number
        });

        await nouveauProno.save();
        res.redirect("/");
    } catch (error) {
        console.error("Erreur Mongoose :", error);
        res.status(400).send("Erreur lors de l'ajout du prono.");
    }
});


// ✅ Marquer un prono comme gagné/perdu
router.post("/:id/statut", verifySession("admin"),async (req, res) => {
    await Prono.findByIdAndUpdate(req.params.id, { statut: req.body.statut });
    res.redirect("/");
});

router.post("/:id/commentaire", isAuthenticated(),async (req, res) => {
    const { auteur, contenu } = req.body;

    const prono = await Prono.findById(req.params.id);
    prono.commentaires.push({ auteur, contenu });
    await prono.save();

    res.redirect("/");
});

router.delete("/:pronoId/commentaire/:commentaireId", verifySession("admin"),async (req, res) => {
    const { pronoId, commentaireId } = req.params;

    try {
        const prono = await Prono.findById(pronoId);
        if (!prono) {
            console.error("Prono non trouvé");
            return res.status(404).json({ message: "Prono non trouvé" });
        }

        const commentaire = prono.commentaires.id(commentaireId);
        if (!commentaire) {
            console.error("Commentaire non trouvé");
            return res.status(404).json({ message: "Commentaire non trouvé" });
        }

        prono.commentaires.pull(commentaireId);  

        await prono.save();  

        res.redirect("/");
    } catch (error) {
        console.error("Erreur lors de la suppression:", error);  
        res.status(500).json({ message: "Erreur lors de la suppression du commentaire." });
    }
});

// user

// Register
router.post("/register", async (req, res) => {
    try {
        const existingUser = await User.findOne({ nom: req.body.nom });
        if (existingUser) {
            req.flash("error", "Utilisateur déjà existant, veuillez essayer de vous connecter.");
            return res.redirect("/compte");
        } else {
            const hashedPassword = await bcrypt.hash(req.body.password, 10);
            req.body.password = hashedPassword;

            const newUser = new User(req.body);
            await newUser.save();

            req.flash("success", "Compte créé avec succès ! Vous pouvez maintenant vous connecter.");
            return res.redirect("/compte");
        }
    } catch (err) {
        console.error("Erreur lors de l'inscription :", err);
        res.status(500).json({ message: err.message });
    }
});

// Login
router.post("/login", async (req, res) => {
    try {
        const user = await User.findOne({ nom: req.body.nom });

        if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
            req.flash("error2", "Utilisateur ou mot de passe incorrect.");
            return res.redirect('/compte');
        }

        user.status = 'Connecté'; 
        await user.save();

        req.session.user = user;
        req.session.userId = user._id;
        req.session.status = user.status;

        req.session.save(err => {
            if (err) {
                console.error('Erreur lors de la sauvegarde de la session:', err);
                return res.status(500).send('Erreur serveur.');
            }
            req.flash("success", "Connexion réussie !");
            res.redirect('/'); 
        });
    } catch (error) {
        console.error('Erreur lors de la tentative de connexion:', error);
        res.status(500).send('Erreur serveur.');
    }
})

// Logout
router.post("/logout", async (req, res) => {
    try {
        const userId = req.session.userId;  

        if (!userId) {
            return res.redirect('/');
        }

        const user = await User.findById(userId);

        if (user) {
            user.status = 'Non connecté';
            await user.save();
        }

        req.session.destroy(err => {
            if (err) {
                return res.status(500).send('Erreur lors de la déconnexion');
            }
            res.redirect('/'); 
        });
    } catch (err) {
        console.error('Erreur lors de la déconnexion:', err.message);
        res.status(500).json({ message: err.message });
    }
});

// montrer un user par id
router.get("/showuser/:id", isAuthenticated(),async (req, res) => {
    const userId = req.params.id
    try {
        const user = await User.findById(userId)
        res.render("showUser", { user });
    }
    catch(err) {
        res.status(500).json({message: err.message})
    }
});

// // retirer un user par id
router.get("/deleteuser/:id", async (req, res) => {
    res.render("deleteuser");
});
router.delete("/deleteuser/:id",async (req, res) => {
    const userId = req.params.id;
    try {
        const user = await User.findByIdAndDelete(userId);

        if (req.session.userId === userId) {
            req.session.status = 'Non connecté'; 
            req.session.userId = null; 
            req.session.user = null; 

            req.session.save(err => {
                if (err) {
                    console.error('Erreur lors de la mise à jour de la session:', err);
                    return res.status(500).send('Erreur serveur.');
                }
                res.redirect("/compte");
            });
        } else {
            res.redirect("/compte");
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
