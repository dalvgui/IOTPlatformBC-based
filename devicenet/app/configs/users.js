// los usuarios se deberian almacenar en una base de datos y las contraseñas encriptadas
// nivel de autorizacion 3 tendra todos los permisos , 2 todo menos crear objetos y cancelarlos y 1 unicmaente leer dispositivos
module.exports = { 
    users: [
        {
            user : "admin",
            pw : "123|#@|~lasdk*",
            authorization_level : 3
        } ,
        {
            user : "administrative" ,
            pw : "law12!abc*" ,
            authorization_level : 1
        },
        {
            user : "operator" ,
            pw : "waap0?21@ac" ,
            authorization_level : 2
        }
    ]
}