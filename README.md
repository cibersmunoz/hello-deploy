1. Creamos el repositorio local.

```bash
git init
git add .
git commit -m "build"
```

2. Subimos el repo a github

```bash
gh repo create
gh repo list
```

3. Creamos una app para desplegar

```bash
npm i express
npm install express
```

```js
const express = require("express");
const app = express();

app.get("/", (req, res) => {
    res.send("Hola mundo");
});

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});
```

4. Añadimos `node_modules` al `.gitignore`
5. Testeamos si la app funciona

```bash
node server.js
curl localhost:3000
```

6. Lanzamos nuestros VPS y creamos los secretos de github

```
SSH_HOST=ip
SSH_USER=usuario
SSH_PASSWORD=contraseña
```

7. Clonamos el repo en el VPS

```bash
git clone <URL>
```

8. Actualizamos el VPS y descargamos las dependencias

```bash
apt update
apt install nodejs npm -y
npm install -g pm2
```

9. Instalamos dependencias de npm y probamos a lanzar la app

```bash
cd <repo>
npm install
node server.js
curl <ip>:3000
```

10. Usamos `pm2` para lanzar la app en segundo plano

```bash
pm2 start server.js --name <nombre>
```

11. Comenzamos a crear el deploy, creamos la carpeta `.github` y dentro otra carpeta llamada `workflows`, por ultimo, dentro, creamos `deploy.yml`

```bash
.github/
└── workflows
    └── deploy.yml
```
12. Una vez funciona el deploy, empezamos con la autenticacion de usuarios, necesitaremos las siguientes dependencias:

```bash
npm i dotenv passport passport-github2 express-session
```

13. Añadimos las librerias a nuestro servidor:

```js
const dotenv = require('dotenv').config();
const express = require('express');
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const session = require('express-session');
```
14. Capturamos las variables de entorno:

```js
const CLIENT_ID_GITHUB = process.env.CLIENT_ID_GITHUB;
const CLIENT_SECRET_GITHUB = process.env.CLIENT_SECRET_GITHUB;
```

15. Creamos la estrategia de autenticacion y la configuramos para usar nuestra app de github:

```js
passport.use(new GitHubStrategy({
    clientID: CLIENT_ID_GITHUB,
    clientSecret: CLIENT_SECRET_GITHUB,
    callbackURL: 'http://localhost:3000/auth/github/callback'
},
    function (accessToken, refreshToken, profile, done) {
        // Aquí puedes guardar el perfil del usuario en la base de datos si es necesario
        return done(null, profile);
    }
));
```

16. Serializamos y deserializamos el usuario:

```js
passport.serializeUser((user, done) => {
    done(null, user);
});
passport.deserializeUser((user, done) => {
    done(null, user);
});
```
17. Configuramos las sesiones y el middleware de passport:

```js
app.use(session({ secret: 'secreto', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());
```
18. Creamos las rutas de autenticacion:

```js
// Rutas
app.get('/', (req, res) => {
    res.send('<a href="/auth/github">Iniciar sesión con GitHub</a>');
});

app.get('/auth/github',
    passport.authenticate('github', { scope: ['user:email'] })
);

app.get('/auth/github/callback',
    passport.authenticate('github', { failureRedirect: '/' }),
    (req, res) => {
        res.redirect('/profile');
    }
);
app.get('/profile', (req, res) => {
    if (!req.isAuthenticated()) {
        return res.redirect('/');
    }
    res.send(`Hola ${req.user.username}`);
});
```

Podemos reutilizar el metodo `isAuthenticated` en un middleware:

```js
const middlewareAuth = (req, res, next) => {
    if (req.isAuthenticated()) {
        console.log("User is authenticated");
        return next();
    } else {
        console.log("User is not authenticated");
        return res.redirect("/");
    }
}
```

Podemos usar el middleware en cualquier ruta:

```js
app.get('/profile', isAuthenticated, (req, res) => {
    res.send(`Hola ${req.user.username}`);
});
```