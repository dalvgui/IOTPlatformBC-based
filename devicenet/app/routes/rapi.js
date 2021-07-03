const hyperledger = require('../hp_handler');
var safe = require('safe-regex');

module.exports = async function (app , routerUsuarioToken  , routerAdminAuthorizationLevel , routerOperatorAuthorizationLevel) {

   
    app.get("/api/devices/:id?", routerUsuarioToken , async (req, res) => {               
        try {   
            var devices = await hyperledger.getDevices();            
           
            if(req.params.id){
                    var filtered = devices.filter(el => el.deviceId == req.params.id);
                    if(filtered.length>0){
                        var device = filtered[0];                    
                        res.status(200).json(device);               
                    }
                    else{
                        res.status(404).json({ message: 'The device you are looking for does not exist' });                     
                    }
                }
                else{                                                        
                    res.status(200).json(devices);    
                }          
            }
            catch (e) {                
                res.status(400).json({ message: 'Bad Request: Failed to query devices' }); 
            }                         
        });
  

    app.post("/api/create", routerUsuarioToken , routerAdminAuthorizationLevel , async (req, res) => {        
        let deviceId = req.body.id;
        let issue_date = req.body.date;        
        
        if(deviceId && issue_date){

            const regexUUIDV4 = /^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i;
            let isvalid = safe(deviceId.match(regexUUIDV4))
            if(isvalid == null){
                res.status(705).json({ message: 'Error, the UUID v4 does not comply with the format according to the RFC4122 reference.' });  
            }
            
            try {
                await hyperledger.createDevice(deviceId , issue_date);
                var devices = await hyperledger.getDevices();      
                var filtered = devices.filter(el => el.deviceId == deviceId);
                if(filtered.length>0){
                    var device = filtered[0];                    
                    res.status(200).json(device);               
                }
                else{
                    res.status(404).json({ message: 'Error, created device not found' });    
                }
                
                
            } catch (error) {
                res.status(412).json({ message: 'Created device already exists' });     //aunque consigas saltarte el filtro, el SmartContract tb lo validará
            }
        }
        else{            
            res.status(400).json({ message: `Bad Request: The "id" and "date" parameters are required` });
        }
        
        });
 
    app.post("/api/register/:id", routerUsuarioToken , routerOperatorAuthorizationLevel , async (req, res)  => {
            let deviceId = req.params.id;                     
            //verificar si de verdad está en el estado 
            var devices = await hyperledger.getDevices(); 
            var filtered = devices.filter(el => el.deviceId == req.params.id);
            if(filtered.length>0){
                var device = filtered[0];       
                
                if(!ValidateIPaddress(req.body.ip)){
                    res.status(710).json({ message: 'Error, IP does not maintain the proper format' });    
                }

                else if(!ValidateMACaddress(req.body.mac)){
                    res.status(711).json({ message: 'Error, MAC does not maintain the proper format' });    
                }
                else if(req.body.modelo > 70){
                    res.status(711).json({ message: 'Error, Model cannot exceed 70 characters' });    
                }

                else{
                    try {
                        let ip = req.body.ip;                   
                        let mac = req.body.mac;                 
                        let modelo = req.body.modelo;
                        let infoToHash = {
                            "deviceId" : deviceId ,
                            "issue_date" : device.issue_date,
                            "ip" : ip ,
                            "mac" : mac,
                            "modelo" : modelo
                        }
                        let hash = hyperledger.sha256(JSON.stringify(infoToHash));                                          
                        await hyperledger.registerDevice(deviceId , ip , mac ,  modelo, hash);
                        devices = await hyperledger.getDevices(); 
                        var filtered = devices.filter(el => el.deviceId == deviceId);
                        if(filtered.length>0){
                            var device = filtered[0];                    
                            res.status(200).json(device);               
                        }
                        else{
                            res.status(404).json({ message: 'Error, created device not found' });    
                        }
    
                    } catch (error) {
                        res.status(412).json({ message: 'Error, the device could not be registered, the device status may not be available for registration' });    
                    }
                }                                
            }
            else{
                res.status(400).json({ message: 'Bad Request: There is no device for that ID' });    
            }    
               
    
        }
    );

    app.get("/api/cancel/:id", routerUsuarioToken ,  routerAdminAuthorizationLevel ,async (req, res) => {        
        var devices = await hyperledger.getDevices(); 
        var filtered = devices.filter(el => el.deviceId == req.params.id);
        var id =req.params.id;
        if(filtered.length>0){                
            try {
                await hyperledger.cancelDevice(id);
                devices = await hyperledger.getDevices(); 
                var filtered = devices.filter(el => el.deviceId == id);
                if(filtered.length>0){                                   
                    res.status(200).json(filtered[0]);               
                }
                else{
                    res.status(404).json({ message: 'Error, canceled device not found' });    
                }
            } catch (e) {                
                res.status(412).json({ message: 'Error, the device could not be unregistered, the device status may not be available for registration' });                    
            }                       
        }
        else{
            res.status(400).json({ message: 'Error, device does not exist' }); 
        }
    });   
};



    
function ValidateIPaddress(ipaddress) {  
    if (safe(/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ipaddress))) {  
      return true;
    }      
    return false;
  }  


function ValidateMACaddress(macaddress) {  
    if (safe((/^[0-9a-f]{1,2}([\.:-])(?:[0-9a-f]{1,2}\1){4}[0-9a-f]{1,2}$/.test(macaddress)))) {  
      return true;
    }      
    return false;
  }  
