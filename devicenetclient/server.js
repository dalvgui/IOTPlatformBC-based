'use strict';

//express
const fetch = require('node-fetch');
const express = require('express');
const app = express();
const crypto = require('crypto');
require('dotenv').config()

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "POST, GET, DELETE, UPDATE, PUT");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, token");    
    next();
});

//Usar carpeta publica
app.use(express.static('public'));

// Logging
const logger = require('./logger');

// swig 
var swig = require('swig');

app.use(express.urlencoded({extended: true})); 
app.use(express.json());


//secret
const config = require('./configs/config')
app.set('clave', config.llave);

var expressSession = require('express-session');
app.use(expressSession({
    secret: 'abcdefg',
    resave: true,
    saveUninitialized: true
}));

var routerUsuarioToken = express.Router();
routerUsuarioToken.use(function (req, res, next) {
    // obtener el token, puede ser un parámetro GET , POST o HEADER
    if(req.session.token){
        next();
    }
    else{
        res.redirect("/login" +
        "?mensaje=Login with your credentials to use the application"+
        "&tipoMensaje=warning");
    }
});


app.listen(process.env.PORT);
logger.log('info', `app running on port ${process.env.PORT}`);




// HomeController
app.get("/", function (req, res) {
    res.redirect("/home");
});

app.get("/home", function (req, res) {    
    var respuesta = swig.renderFile('views/home.html', {
        token : req.session.token ,
        username : req.session.username  
    });
    res.send(respuesta);
});


app.get("/login", function (req, res) {    
    var respuesta = swig.renderFile('views/login.html', {
        token : req.session.token  ,
        username : req.session.username     
    });
    res.send(respuesta);
});

app.post("/login", async (req, res) =>{         

    let data = {
        "username":req.body.username ,
        "password": req.body.password
    }

    let response = await fetch(`${process.env.DEVICENET_SERVICE}api/login`, {
        method: 'post',
        body:    JSON.stringify(data),
        headers: {  'Content-Type': 'application/json' },
      })
        .then(res => res.json())
        .catch(json =>  res.redirect("/create" +
        "?mensaje=Could not connect to DeviceNet service"+
        "&tipoMensaje=danger"));

    if(response.token){
        req.session.token = response.token;
        req.session.username = req.body.username;
        res.redirect("/home" +
        "?mensaje=Valid credentials"+
        "&tipoMensaje=success");        
    }
    else{
        res.redirect("/login" +
                "?mensaje=Invalid credentials"+
                "&tipoMensaje=danger");
    }
});

app.get("/logout", function (req, res) {    
    req.session.token = undefined;
    req.session.username  = undefined;

    res.redirect("/home" +
    "?mensaje=Session has been disconnected"+
    "&tipoMensaje=success");  
});

// Controladores
require("./routes/rdevices.js")(app, swig , routerUsuarioToken);


app.get('*', function(req, res){
    var respuesta = swig.renderFile('views/error404.html', {});
    res.send(respuesta);
  });