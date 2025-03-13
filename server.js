const dotenv = require("dotenv").config();
const passport = require("passport");
const GithubStrategy = require("passport-github2").Strategy;
const session = require("express-session");
const express = require("express");
const app = express();
const exec = require("child_process").exec;

const CLIENT_ID_GITHUB = process.env.CLIENT_ID_GITHUB;
const CLIENT_SECRET_GITHUB = process.env.CLIENT_SECRET_GITHUB;
console.log(`CLIENT_ID_GITHUB: ${CLIENT_ID_GITHUB}`);
console.log(`CLIENT_SECRET_GITHUB: ${CLIENT_SECRET_GITHUB}`);

passport.use(new GithubStrategy({
    clientID: CLIENT_ID_GITHUB,
    clientSecret: CLIENT_SECRET_GITHUB,
    callbackURL: "http://localhost:3000/auth/github/callback",
}, function (accessToken, refreshToken, profile, done) {
    console.log("Profile: ", profile);
    return done(null, profile);
}));

passport.serializeUser((user, done) => {
    console.log("Serializing user:", user);
    done(null, user);
});

passport.deserializeUser((user, done) => {
    console.log("Deserializing user:", user);
    done(null, user);
});

app.use(session({
    secret: "supersecreto",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Cambia a true si usas HTTPS
}));
app.use(passport.initialize());
app.use(passport.session());

// Middleware para analizar el cuerpo de la solicitud
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const middlewareAuth = (req, res, next) => {
    if (req.isAuthenticated()) {
        console.log("User is authenticated");
        return next();
    } else {
        console.log("User is not authenticated");
        return res.redirect("/");
    }
}
app.use(middlewareAuth);

app.get("/", (req, res) => {
    const html = `
    <a href="/auth/github">Login with GitHub</a>`
    res.send(html);
});

app.get("/auth/github", 
    passport.authenticate('github', { scope: ['user:email'] 
}));

app.get("/auth/github/callback", passport.authenticate('github', { failureRedirect: '/' }),
    (req, res) => {
        console.log("User authenticated successfully");
        res.redirect("/profile");
    }
);

app.get("/profile", (req, res) => {
    if(!req.isAuthenticated()) {
        return res.redirect("/");
    }
    const html = `Hola ${req.user.username || req.user.displayName}`
    res.send(html)
})

app.get("/recon", (req, res) => {
    if (!req.isAuthenticated()) {
        return res.redirect("/");
    }
    const html = `aqui ira mi recon`
    res.send(html)
})

app.get("/run-command", (req, res) => {
    exec("touch test", (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return res.status(500).send("Error executing script");
        }
        console.log(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);
        res.send("Script executed successfully");
    });
});

app.post("/recon", (req, res) => {
    console.log("Received request to /recon");
    const domain = req.body.domain || req.query.domain;
    const APIKEY = req.body.APIKEY || req.query.APIKEY;

    console.log(`Domain: ${domain}`);
    console.log(`APIKEY: ${APIKEY}`);
    if(APIKEY !== "1234") {
        return res.status(403).send("Forbidden");
    } else {
    exec(`./recon.sh ${domain} > resultados`, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return res.status(500).send("Error executing script");
        } else {
            console.log(`stdout: ${stdout}`);
            console.error(`stderr: ${stderr}`);
            res.send("Script executed successfully");
        } 
    });
    }
});

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});