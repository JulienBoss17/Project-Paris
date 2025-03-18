const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
require("dotenv").config();
const ejs = require("ejs")
const bcrypt = require("bcryptjs");
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require("method-override");
const MongoStore = require('connect-mongo');

//set up session
const app = express();
app.set("view engine", "ejs");
app.set("views", "./Views/Pages");
app.use(express.static("Public"));
app.use(express.static("style")); 
app.use(session({
    secret: process.env.SECRETSESSION,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 1, // 1 heure
    }
  }));
app.use(flash());
app.use((req, res, next) => {
    res.locals.success_msg = req.flash("success");
    res.locals.error_msg = req.flash("error");
    res.locals.success_msg2 = req.flash("success2");
    res.locals.error_msg2 = req.flash("error2");
    next();
});
app.use(function (req, res, next) {
    res.locals.user = req.session.user;
    next();
});

//Middleware
app.use(express.urlencoded({ extended: true })); 
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

// Routes
const homeRouter = require("./Routes/Home");

app.use(homeRouter);

// Connect to DB

console.log("✅ L'application démarre...");


mongoose.connect(process.env.MONGO_URI, {  
    connectTimeoutMS: 30000,
    serverSelectionTimeoutMS: 30000 
})
.then(() => console.log("✅ Connecté à MongoDB"))
.catch(err => console.error("❌ Erreur de connexion MongoDB :", err));


const port= process.env.PORT || 30224;

app.listen(port,() => {
    console.log("listening http://localhost:"+ port)
})