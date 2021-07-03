'use strict';

//express
const express = require('express');
const app = express();

require('dotenv').config()

// Helmet para evitar vulnearbilidades en las cabeceras http
var helmet = require('helmet');
app.use(helmet());
app.disable('x-powered-by');

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "POST, GET, DELETE, UPDATE, PUT");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, token");    
    next();
});

//jsonwebtoken
const jwt = require('jsonwebtoken');
const config = require('./configs/config')
app.set('clave', config.llave);

//crypt
var crypto = require('crypto');
app.set('crypto', crypto);


           

// Logging
const logger = require('./logger');

app.use(express.urlencoded({extended: true})); 
app.use(express.json());

//
const hp = require("./hp_handler")
var promise = new Promise(async function(resolve , reject){
    await hp.setup();
    resolve();
});
promise.then(function(){
    // Start the app
    app.listen(process.env.PORT);
    logger.log('info', `api running on port ${process.env.PORT}`);
})

/* app.listen(process.env.PORT);
logger.log('info', `api running on port ${process.env.PORT}`); */

const users = require('./configs/users').users;

var routerUsuarioToken = express.Router();
routerUsuarioToken.use(function (req, res, next) {
    // obtener el token, puede ser un parámetro GET , POST o HEADER
    var token = req.body.token || req.query.token || req.headers['token'];
    if (token != null) {
        // verificar el token
        jwt.verify(token, app.get('clave'), function (err, infoToken) {
            if (err || (Date.now() / 1000 - infoToken.tiempo) > 240) {
                return res.status(700).json({ message: 'Error: Invalid Token' });                
                

            } else {                                
                next();
            }
        });
    } else {
        return res.status(700).json({ message: 'Error: Token required' });              
    }
});


var routerAdminAuthorizationLevel = express.Router();
routerAdminAuthorizationLevel.use(function (req, res, next) {
   
    var username = req.body.username || req.query.username || req.headers['username'];
    if (username != null) {
      var user_bbdd = users.filter(el => el.user == username )[0];
      
      if(user_bbdd.authorization_level >=3){
          next();
      }
      else{
        return res.status(701).json({ message: 'Error: You dont have permissions.' });     
      }
    } else {
        return res.status(702).json({ message: 'Error: Unauthenticated user.' });              
    }
});

var routerOperatorAuthorizationLevel = express.Router();
routerOperatorAuthorizationLevel.use(function (req, res, next) {
   
    var username = req.body.username || req.query.username || req.headers['username'];
    if (username != null) {
      var user_bbdd = users.filter(el => el.user == username )[0];
      
      if(user_bbdd.authorization_level >=2){
          next();
      }
      else{
        return res.status(701).json({ message: 'Error: You dont have permissions.' });     
      }
    } else {
        return res.status(702).json({ message: 'Error: Unauthenticated user.' });              
    }
});



//controlador login
app.post("/api/login", function (req, res) {   
    var pw = crypto.createHmac('sha256', app.get('clave'))
    .update(req.body.password).digest('hex');

    var token = null;

    users.forEach(el => {
        var seguro = app.get("crypto").createHmac('sha256', app.get('clave'))
            .update(el.pw).digest('hex');
        if(req.body.username==el.user && pw == seguro){
            const payload = {
                check:  true
            };
            token = jwt.sign(payload, app.get('clave'), {
                expiresIn: 60*15 //15 minutos
            });                   
            }
    });

    if(token != null){
        res.status(200).json({ token : token });       
    }
    else{
        res.status(403).json({ message: 'Error: Invalid credentials' });
    }    
    
});



// Controladores
require("./routes/rapi.js")(app , routerUsuarioToken , routerAdminAuthorizationLevel , routerOperatorAuthorizationLevel );