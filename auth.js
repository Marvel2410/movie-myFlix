const jwtSecret = 'your_jwt_secret'; //This has to be the same key used in the JWTStrategy

const jwt = require('jsonwebtoken'),
passport = require('passport');

require('./passport'); //Your local passport file

let generateJWTToken = (user) => {
    return jwt.sign(user, jwtSecret, {
        subject: user.Username, //This is the username you're encoding in the JWT
        expiresIn: '7d', //This specifies that the token will expire in 7 dayz
        algorithm: 'HS256' //This is the algorithm used to sign or encode the values of the JWT
    });
}