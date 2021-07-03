const { v4: uuidv4 } = require('uuid');
const fetch = require('node-fetch');

module.exports = async function (app, swig , routerUsuarioToken) {

   
    app.get("/devices/:id?", routerUsuarioToken , async (req, res) => {                                
        var headers = {
            token: req.session.token  ,            
            username : req.session.username           
          }        
          
        if(req.params.id){                
                let status;    
                let resultado = await fetch(`${process.env.DEVICENET_SERVICE}api/devices/${req.params.id}` , { method: 'GET', headers: headers})
                .then(res => {
                    status = res.status; 
                    return res.json() 
                })
                .catch(json =>   res.redirect("/home" +
                "?mensaje=Could not connect to DeviceNet service correctly"+
                "&tipoMensaje=danger"));
                
                if(status == 200){
                    resultado.state_name = resultado.state == 0 ? "ISSUED" : resultado.state == 1 ? "REGISTERED" : "REDEEMED"                    
                    var respuesta = swig.renderFile('views/device.html',
                    {
                        device: resultado  ,
                        token : req.session.token  ,            
                        username : req.session.username                   
                    });
                    res.send(respuesta);
                }
                else{
                    if(status==700){
                        res.redirect(`/login?mensaje=Invalid credentials&tipoMensaje=danger`);
                    }
                    else{
                        res.redirect(`/home?mensaje=${resultado.message}&tipoMensaje=danger`);
                    }
                }                           
            }
            else{                         
                let status;    
                let resultado = await fetch(`${process.env.DEVICENET_SERVICE}api/devices`, { method: 'GET', headers: headers})
                    .then(res => {
                        status = res.status; 
                        return res.json() 
                    })
                    .catch(json =>   res.redirect("/home" +
                    "?mensaje=Could not connect to DeviceNet service correctly"+
                    "&tipoMensaje=danger"));   
                if(status ==200){
                    var respuesta = swig.renderFile('views/devices.html',
                    {
                        devices: resultado ,
                        token : req.session.token  ,            
                        username : req.session.username                          
                    });
                    res.send(respuesta);
                }
                else{
                    if(status == 700){
                        res.redirect(`/login?mensaje=Invalid credentials&tipoMensaje=danger`);
                    }
                    else{
                        res.redirect(`/home?mensaje=${resultado.message}&tipoMensaje=danger`);
                    }
                    }                                                              
                }                                                                                 
        });  
     
    app.get("/create", routerUsuarioToken , function (req, res) {
        var now = new Date();
        var day = ("0" + now.getDate()).slice(-2);
        var month = ("0" + (now.getMonth() + 1)).slice(-2);        
        var today = now.getFullYear()+"-"+(month)+"-"+(day);
        var id_generated = uuidv4();
        var respuesta = swig.renderFile('views/new.html',
                {        
                    id_generated : id_generated  ,
                    date : today    ,                    
                    token : req.session.token    ,            
                    username : req.session.username   
                });
                res.send(respuesta);
        }
    );
    app.post("/create", routerUsuarioToken , async (req, res) => {   
        let deviceId = req.body.idInput;
        let issue_date = req.body.dateInput;        
        
        if(deviceId && issue_date){            
                let data = {
                    "id":deviceId ,
                    "date": issue_date
                }
                let status;
                let resultado = await fetch(`${process.env.DEVICENET_SERVICE}api/create`, {
                    method: 'post',
                    body:    JSON.stringify(data),
                    headers: {  'Content-Type': 'application/json' , token: req.session.token , username : req.session.username  },
                  })
                    .then(res => {
                        status = res.status; 
                        return res.json() 
                    })
                    .catch(json =>  res.redirect("/create" +
                    "?mensaje=Could not connect to DeviceNet service"+
                    "&tipoMensaje=danger"));
                              
                if(status == 200){
                        res.redirect(`/devices/${resultado.deviceId}?mensaje=New Device has been added&tipoMensaje=success`)                        
                }
                else{
                    if(status == 700){
                        res.redirect(`/login?mensaje=Invalid credentials&tipoMensaje=danger`);
                    }
                    else{
                        res.redirect("/create" +
                        `?mensaje=${resultado.message}&tipoMensaje=danger`);
                    }                
                }                                    
        }
        else{       
            res.redirect("/create?mensaje=The form fields are required&tipoMensaje=danger");
        }
        
    });

    app.get("/register/:id", routerUsuarioToken , async (req, res)  => {   
        var headers = {
            token: req.session.token  ,
            username : req.session.username   
          }           
        let status;
        let device = await fetch(`${process.env.DEVICENET_SERVICE}api/devices/${req.params.id}` , { method: 'GET', headers: headers})
        .then(res =>{
            status = res.status; 
            return res.json() 
        })
        .catch(json =>   res.redirect(`/devices/${req.params.id}?mensaje=Could not connect to DeviceNet service correctly&tipoMensaje=danger`));

        if(status == 200){
            var respuesta = swig.renderFile('views/register.html',
            {
                device: device ,
                token : req.session.token  ,            
                username : req.session.username  
            });
            res.send(respuesta);
        }
        else{
            if(status == 700){
                res.redirect(`/login?mensaje=Invalid credentials&tipoMensaje=danger`);
            }
            else{
                res.redirect(`/devices/?mensaje=${device.message}&tipoMensaje=danger`);
            }
        }     
    });

    app.post("/register/:id", routerUsuarioToken, async (req, res)  => {    
                 
            let ip = req.body.ipInput;                   
            let mac = req.body.macInput;                 
            let modelo = req.body.modeloInput;         
            let data = {                
                "ip": ip  ,
                "mac":mac,
                "modelo":modelo
            }
            let status;
            let resultado = await fetch(`${process.env.DEVICENET_SERVICE}api/register/${req.params.id}`, {
                method: 'post',
                body:    JSON.stringify(data),
                headers: {  'Content-Type': 'application/json'  , token: req.session.token , username : req.session.username  },
              })
                .then(res => {
                    status = res.status; 
                    return res.json() 
                })
                .catch(json =>  res.redirect("/home" +
                "?mensaje=Could not connect to DeviceNet service"+
                "&tipoMensaje=danger"));
            
            if(status == 200){
                res.redirect(`/devices/${resultado.deviceId}?mensaje=Device has been registered&tipoMensaje=success`)
            }
            else{
                if(status == 700){
                    res.redirect(`/login?mensaje=Invalid credentials&tipoMensaje=danger`);
                }
                else{
                    res.redirect(`/register/${req.params.id}?mensaje=${resultado.message}&tipoMensaje=danger`);
                }
            }               
        }
    );

    app.get("/cancel/:id", routerUsuarioToken , async (req, res) => {               
        var headers = {
            token: req.session.token  ,
            username : req.session.username     
        }       
        let status;         
        let resultado = {};      
        resultado = await fetch(`${process.env.DEVICENET_SERVICE}api/cancel/${req.params.id}` , { method: 'GET', headers: headers})
        .then(res => {
            status = res.status; 
            return res.json() 
        })
        .catch(json =>   res.redirect(`/devices/${req.params.id}?mensaje=Could not connect to DeviceNet service correctly&tipoMensaje=danger`));

        if(status == 200){
            res.redirect(`/devices/${resultado.deviceId}?mensaje=Device has been canceled&tipoMensaje=success`)
        }
        else{
            if(status == 700){
                res.redirect(`/login?mensaje=Invalid credentials&tipoMensaje=danger`);
            }
            else{
                res.redirect(`/devices/${req.params.id}?mensaje=${resultado.message}&tipoMensaje=danger`);
            }
            }        
    });
};



    

