//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const mongoose = require("mongoose");


mongoose.connect("mongodb://0.0.0.0:27017/userDB", { useNewUrlParser: true });
const app = express();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

app.use(session({
    secret: "Let's keep this a secret just between two of us.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model('User', userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
    process.nextTick(function () {
        done(null, { id: user._id, username: user.username });
    });
});
passport.deserializeUser(function (user, done) {
    process.nextTick(function () {
        return done(null, user);
    });
});

app.get("/", function (req, res) {
    res.render("home");
});

app.get('/login', function (req, res) {
    res.render("login");
})

app.get("/register", (req, res) => {
    res.render("register");
})

app.get("/secrets", (req, res) => {
    if (req.isAuthenticated()) {
        res.render("secrets");
    } else {
        res.redirect('/login');
    }
});

app.get("/logout" , (req,res)=>{
    req.logout(()=>{
        res.redirect("/");
    });
})

app.post("/register", async (req, res) => {


    await User.register({ username: req.body.username }, req.body.password, (err, user) => {
        if (err) {
            console.log(err);
            res.redirect("/register");
        }
        else {
            passport.authenticate("local")(req, res, () => {
                res.redirect("/secrets");
            })
        }
    });
});

app.post("/login", (req, res) => {

    const user = new User({
        email: req.body.username,
        password: req.body.password
    });
    req.login(user , (err)=>{
        if(!err){
            passport.authenticate("local")(req,res, ()=>{
                res.redirect("/secrets");
            });
        } else {
            console.log(err);
            res.redirect("/register");
        }
    })
});



app.listen("3000", function () {
    console.log("Server is running at port 3000");
})