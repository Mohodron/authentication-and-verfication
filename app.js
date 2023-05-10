//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const saltRounds = 10;

mongoose.connect("mongodb://0.0.0.0:27017/userDB", { useNewUrlParser: true });
const app = express();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

const User = new mongoose.model('User', userSchema);

app.get("/", function (req, res) {
    res.render("home");
});

app.get('/login', function (req, res) {
    res.render("login");
})

app.get("/register", (req, res) => {
    res.render("register");
})

app.post("/register", (req, res) => {

    bcrypt.hash(req.body.password, saltRounds, async function (err, hash) {

        const newUser = new User({
            email: req.body.username,
            password: hash
        });

        await User.findOne({ email: req.body.username })
            .then(response => {
                if (response === null) {
                    newUser.save()
                        .then(response => {
                            if (response) {

                                res.render("secrets");
                            }
                        })
                        .catch(err => {
                            if (err) {
                                console.log(err);
                            }
                        });
                } else {
                    res.send("User Already Exists");
                }
            });
    });

});

app.post("/login", (req, res) => {
    async function userLogin() {

        const password = req.body.password;
        const userName = req.body.username;

        await User.findOne({ email: userName })
            .then(response => {
                if (response === null) {
                    res.send("No user Account with " + userName + " address.");
                }
                else if (password === null) {
                    res.send("Wrong Password. Please refresh and try again.");
                } else {
                    bcrypt.compare(password, response.password, function (err, result) {
                        if (result === true) {
                            res.render("secrets");
                        }
                        else {
                            console.log(err);
                        }
                    });
                }



            })
            .catch(err => {
                console.log(err);
            });
    };
    userLogin();

})



app.listen("3000", function () {
    console.log("Server is running at port 3000");
})