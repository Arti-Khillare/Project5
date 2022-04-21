const mongoose = require('mongoose');

const isValidObjectId = function(objectId){
    return mongoose.Types.ObjectId.isValid(objectId);
}

const isValidString = function(value) {
    if(typeof value === 'undefined' || value === null) return false
    if(typeof value === 'number' && value.toString().trim().length === 0) return false
    if(typeof value === 'string' && value.trim().length === 0) return false;
    return true;
}

const isValidPassword = function (password){
    if(password.length <= 15 && password.length >= 8){
        return true;
    }
}  

const isValidNumber = function(value){
    if( isNaN(value) && value.toString().trim().length !== 0) return false;
    return true;
}

const isValidRequestBody = function (requestBody) {
    return Object.keys(requestBody).length > 0;
}

module.exports = {
    isValidObjectId,
    isValidString,
    isValidPassword,
    isValidNumber,
    isValidRequestBody
}
