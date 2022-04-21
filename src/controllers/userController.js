const userModel = require('../models/userModel');
const validator = require('../valid/validator');
const aws = require('../valid/aws.js')
const bcrypt = require('bcrypt');
const saltRounds = 10;
const jwt = require('jsonwebtoken');

//************************************************************postRegisterAPI*****************************************************************//
const createUser = async (req, res) => {
    try {
        let files = req.files
        let requestBody = req.body;

        if (Object.keys(requestBody).length === 0) {
            return res.status(400).send({ status: false, message: `Invalid Request. Please provide user details ` });
        }

        let { fname, lname, email, profileImage, phone, password, address } = requestBody;

        //fname validation
        if (!requestBody.fname) {
            return res.status(400).send({ status: false, message: `fname is required !` });
        }

        if (!validator.isValidString(fname)) {
            return res.status(400).send({ status: false, message: `fname must be filled with string!` });
        }

        //lname validation
        if (!requestBody.lname) {
            return res.status(400).send({ status: false, message: `lname is required!` });
        }

        if (!validator.isValidString(lname)) {
            return res.status(400).send({ status: false, message: `lname must be filled with string !` });
        }

        //email validation
        if (!requestBody.email) {
            return res.status(400).send({ status: false, message: `email is mandatory field!` });
        }

        if (!validator.isValidString(email)) {
            return res.status(400).send({ status: false, message: `email must be filled with string!` });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).send({ status: false, message: `Invalid email Address!` });
        }

        //check uniqueemail 
        const isuniqueEmailCheck = await userModel.findOne({ email: email });
        if (isuniqueEmailCheck) {
            return res.status(400).send({ status: false, message: `${email} is already registered as unique email i required!` });
        }
        //profileImage = await aws.uploadFile(files[0])
        if (files && files.length > 0) {
            requestBody['profileImage'] = await aws.uploadFile(files[0])
        } else {
            return res.status(400).send({ status: false, message: `please provide profile pic ` })
        }

        //phone validation
        if (!requestBody.phone) {
            return res.status(400).send({ status: false, message: `phone is required!` });
        }

        if (!validator.isValidString(phone)) {
            return res.status(400).send({ status: false, message: `phone mst be filled with the string !` });
        }

        if (!/^(\+91)?(-)?\s*?(91)?\s*?([6-9]{1}\d{2})-?\s*?(\d{3})-?\s*?(\d{4})$/.test(phone)) {
            return res.status(400).send({ status: false, message: `Invalid Phone Number!` });
        }

        const isuniquePhoneCheck = await userModel.findOne({ phone: phone });
        if (isuniquePhoneCheck) {
            return res.status(400).send({ status: false, message: `${phone} is already registered as unique phone is required` });
        }

        //password validation
        if (!requestBody.password) {
            return res.status(400).send({ status: false, message: `password is mandatory field!` });
        }

        if (!validator.isValidString(password)) {
            return res.status(400).send({ status: false, message: `password is required!` });
        }
        if (!validator.isValidPassword(password)) {
            return res.status(400).send({ status: false, message: `password must be 8-15 characters long!` });
        }
        const salt = bcrypt.genSaltSync(saltRounds);
        requestBody['password'] = await bcrypt.hash(password, salt)
        
        //address validation
        if (!requestBody.address) {
            return res.status(400).send({ status: false, message: `address is mandatory field!` });
        }
        if (!validator.isValidString(address)) {
            return res.status(400).send({ status: false, message: `address is required!` });
        }
        //shipping validation
        if (!requestBody.address.shipping.street) {
            return res.status(400).send({ status: false, message: 'steet is required' })
        }
        if (!validator.isValidString(address.shipping.street)) {
            return res.status(400).send({ status: false, message: ` street must be filled ` });
        }

        if (!requestBody.address.shipping.city) {
            return res.status(400).send({ status: false, message: 'city is required' })
        }

        if (!validator.isValidString(address.shipping.city)) {
            return res.status(400).send({ status: false, message: ` city must be filled ` });
        }
        if (!requestBody.address.shipping.pincode) {
            return res.status(400).send({ status: false, message: 'pincode is required' })
        }

        if (!validator.isValidString(address.shipping.pincode)) {
            return res.status(400).send({ status: false, message: ` pincode must be filled ` });
        }
        //billing validation
        if (!requestBody.address.billing.street) {
            return res.status(400).send({ status: false, message: 'steet is required' })
        }

        if (!validator.isValidString(address.billing.street)) {
            return res.status(400).send({ status: false, message: ` street must be filled ` });
        }

        if (!requestBody.address.shipping.city) {
            return res.status(400).send({ status: false, message: 'city is required' })
        }

        if (!validator.isValidString(address.billing.city)) {
            return res.status(400).send({ status: false, message: ` city must be filled ` });
        }

        if (!requestBody.address.shipping.pincode) {
            return res.status(400).send({ status: false, message: 'pincode is required' })
        }

        if (!validator.isValidString(address.billing.pincode)) {
            return res.status(400).send({ status: false, message: ` pincode must be filled` });
        }
       
        let user = await userModel.create(requestBody)
        return res.status(201).send({ status: true, message: `User registered successfully!`, data: user });
    }
    catch (error) {
        res.status(500).send({ status: false,message:"Error", error: error.message });
    }
}

//****************************************************************postLogin API**************************************************************//

const userLogin = async (req, res) => {
    try {
        let requestBody = req.body;
        if (Object.keys(requestBody).length === 0) {
            return res.status(400).send({ status: false, message: `Invalid input. Please enter email and password!`, });
        }
        const { email, password } = requestBody;

        if (!requestBody.email) {
            return res.status(400).send({ status: false, message: `email is required!` });
        }
        if (!validator.isValidString(email)) {
            return res.status(400).send({ status: false, message: `email must be filled with string!` });
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).send({ status: false, message: `Invalid email Address!` });
        }
        if (!requestBody.password) {
            return res.status(400).send({ status: false, message: `password is required!` });
        }
        if (!validator.isValidString(password)) {
            return res.status(400).send({ status: false, message: `password must be filled with string!` });
        }
        // checking for password length 
        if(password.length < 8  || password.length >15 ){
            return res.status(400).send({status:false,mesaage:"password length should be inbetween 8 and 15 "})
        }
        
        //check user password with hashed password stored in database
        const chectexistUser = await userModel.findOne({ email: email })
        if (chectexistUser) {
            const checkPassword = await bcrypt.compare(password, chectexistUser.password);
            if (!checkPassword) {
                return res.status(400).send({ status: false, message: `password or email is incorrect` })
            }
        } else {
            return res.status(400).send({ status: false, message: `email or password is incorrect` })
        }

        const token = jwt.sign(
            {
                userId: chectexistUser._id,
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + 60 * 60 * 60
            },
            "thorium@group16"
        );

        res.setHeader("Authorization", token);
        const loginData = { userId: chectexistUser._id, token: token }
        res.status(201).send({ status: true, message: `user login successful`, data: loginData });
    } catch (error) {
        res.status(500).send({ status: false,mesaage:"Error", error: error.message });
    }
};

//*********************************************************getUserprofileAPI***********************************************************//
const getUserprofile = async (req, res) => {
    try {
        let { userId: _id } = req.params;

        if (!validator.isValidObjectId(_id)) {
            return res.status(400).send({ status: false, message: `Invalid ID!` })
        }

        const userData = await userModel.findById(_id);
        if (!userData) {
            return res.status(404).send({ status: false, message: `${_id} is not present in DB!` })
        }

         //authorization
         if (req.userId !== _id) {
            return res.status(403).send({ status: false, message: `you are not authorizated` })
        }

        const newData = await userModel.findById({ _id });
        res.status(200).send({ status: true, message: `User Profile details`, data: newData })

    }
    catch (error) {
        res.status(500).send({ status: false,mesaage: "Error", error: error.message });
    }

}

//**************************************************************updateProfileAPI************************************************************//
const updateProfile = async (req, res) => {
    try {
        let { userId: _id } = req.params;
        let requestBody = req.body;
        if (req.userId !== _id) {
            return res.status(403).send({ status: false, message: `you are not authorizated` })
        }

        let { fname, lname, email, phone, password, address } = requestBody;
        let finalFilter = {}

        if (validator.isValidString(fname)) {
            finalFilter["fname"] = fname
        }
        if (validator.isValidString(lname)) {
            finalFilter["lname"] = lname
        }

        if (validator.isValidString(email)) {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
                return res.status(400).send({ status: false, message: `EMAIL is not valid` })
            }
            const isuniqueEmailCheck = await userModel.findOne({ email })
            if (isuniqueEmailCheck) {
                return res.status(400).send({ status: false, message: `email already used ` })
            }
            finalFilter["email"] = email

        }
        if (validator.isValidString(phone)) {
            if (!(!isNaN(phone)) && /^(\+91)?(-)?\s*?(91)?\s*?([6-9]{1}\d{2})-?\s*?(\d{3})-?\s*?(\d{4})$/.test(phone.trim())) {
                return res.status(400).send({ status: false, message: `PHONE NUMBER is not a valid mobile number` });
            }
            const isuniquePhoneCheck = await userModel.findOne({ phone })
            if (isuniquePhoneCheck) {
                return res.status(400).send({ status: false, message: `phone Number already used ` })
            }
            finalFilter["phone"] = phone
        }
        if (validator.isValidString(password)) {
            const salt = bcrypt.genSaltSync(saltRounds);
            const hashPassword = await bcrypt.hash(password, salt);
            finalFilter["password"] = hashPassword
        }
        if (validator.isValidString(address)) {
            if (address.shipping.pincode) {
                if (typeof address.shipping.pincode == 'number') {
                    return res.status(400).send({ status: false, message: `shipping pincode must be number` })
                }
            }
            if (address.billing.pincode) {
                if (typeof address.billing.pincode == 'number') {
                    return res.status(400).send({ status: false, message: `billing pincode must be number` })
                }
            }
            finalFilter["address"] = address
        }

        //creating the awslink to update
        let files = req.files
        if (files) {
            if (files && files.length > 0) {

                const profileImage = await uploadFile(files[0])

                if (profileImage) {
                    finalFilter["profileImage"] = profileImage
                }
            }
        }
        const postData = await userModel.findOneAndUpdate({ _id: _id }, { $set: finalFilter }, { new: true })

        return res.status(200).send({ status: true, message: `User profile updated`, data: postData })
    }
    catch (error) {
        res.status(500).send({ status: false, message: "Error",error: error.message });
    }

}

module.exports = { createUser, userLogin, getUserprofile, updateProfile }

