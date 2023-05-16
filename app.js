//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const mongoose = require("mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");
const FacebookStrategy = require("passport-facebook").Strategy;

mongoose.connect("mongodb://0.0.0.0:27017/userDB", { useNewUrlParser: true });
const app = express();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

app.use(session({
    secret: "Let's keep this a secret just between two of us.",
    resave: false,
    saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId : String,
    facebookId: String,
    secret : String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model('User', userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(obj, done) {
    done(null, obj);
  });

//////////////////////////////////////Google Login///////////////////////////////////////////////////////
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileUrl: "https://www.googleapis.com/oauth2/v3/userinfo"
  },

  function(accessToken, refreshToken, profile, cb) {

    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

/////////////////////////////////////////////Faceook login////////////////////////////////////////////////////
passport.use(new FacebookStrategy({
    clientID: process.env.APP_ID,
    clientSecret: process.env.APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secret"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
        console.log(profile);
      return cb(err, user);
    });
  }
));

app.get("/", function (req, res) {
    res.render("home");
});

app.get('/login', function (req, res) {
    res.render("login");
})

app.get("/register", (req, res) => {
    res.render("register");
})

app.get("/secrets", async (req, res) => {
    User.find({"secret" : {$ne : null}})
    .then((response)=>{
      res.render("secrets", {usersWithSecrets : response})
    })
    .catch(err=>{
      if(err){
        console.log(err);
      }
    })

});

app.get("/logout" , (req,res)=>{
    req.logout(()=>{
        res.redirect("/");
    });
});

app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile"] }));


app.get("/auth/google/secrets", 
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  });

  app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get('/auth/facebook/secret',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  });

app.get("/submit", (req,res)=>{
  if (req.isAuthenticated()) {
    res.render("submit");
} else {
    res.redirect('/login');
}

});



app.post("/register", async (req, res) => {

  if(User.find({ _id: req.user})){
    res.redirect("/login");
  }
  else{
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
  }

    
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

app.post("/submit", async (req,res)=>{
  submittedSecret = req.body.secret;
 console.log(req.user);
  User.findById({_id : req.user})
  .then(response =>{
    if(response != null){
      console.log(response);
      response.secret = submittedSecret;

      response.save();
      res.redirect("/secrets");
    }
  })
  .catch(err=>{
    if(err){
      console.log(err);
    }
  });
 
 });



app.listen("3000", function () {
    console.log("Server is running at port 3000");
})