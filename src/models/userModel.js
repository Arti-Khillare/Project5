const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    fname: {
        type : String, 
        required : true,
        trim : true
    },
    lname: {
        type : String, 
        required : true,
        trim : true
    },
    email: {
        type : String, 
        required : true, 
        unique : true,
        trim : true,
        match:/^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    profileImage: {
        type : String, 
        required : true
    }, // s3 link
    phone: {
        type : String,
        required : true, 
        unique : true, 
        trim : true,
        match:/^(\+91)?(-)?\s*?(91)?\s*?([6-9]{1}\d{2})-?\s*?(\d{3})-?\s*?(\d{4})$/   // /^[6-9]\d{9}$/
    }, 
    password: {
        type : String, 
        required : true, 
        trim : true,
        minLen : 8,
        maxLen : 15
    }, // encrypted password
    address: {
      shipping: {
        street: {type : String, required : true, trim : true},
        city: {type : String, required : true, trim : true},
        pincode: {type : Number, required : true, trim : true}
    },
    billing: {
        street: {type : String, required : true, trim : true},
        city: {type : String, required : true, trim : true},
        pincode: {type : Number, required : true, trim : true}},
    }, 
}, {timestamps : true});

module.exports = mongoose.model("Users" , userSchema)