const productModel = require('../models/productModel.js');
const validator = require('../valid/validator.js');
const aws = require('../valid/aws.js')


//*******************************************************************createProductAPI**********************************************************//
const createProduct = async (req, res) => {
    try {

        //let files = req.files
        let requestBody = req.body;

        if (Object.keys(requestBody).length === 0) {
            return res.status(400).send({ status: false, message: `Invalid Request. Please provide product details ` })
        }

        let { title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments, isDeleted } = requestBody

        if (!requestBody.title) {
            return res.status(400).send({ status: false, message: `title is required !` });
        }

        if (!validator.isValidString(title)) {
            return res.status(400).send({ status: false, message: `title must be filled!` });
        }
        const isTitleUnique = await productModel.findOne({ title: title });
        if (isTitleUnique) {
            return res.status(400).send({ status: false, message: `${title} is already exist!` })
        }
        if (!requestBody.description) {
            return res.status(400).send({ status: false, message: `description is required !` });
        }

        if (!validator.isValidString(description)) {
            return res.status(400).send({ status: false, message: `description must be filled!` });
        }
        if (!requestBody.price) {
            return res.status(400).send({ status: false, message: `price is required !` });
        }

        if (!validator.isValidNumber(price)) {
            return res.status(400).send({ status: false, message: `price must be filled !` })
        }

        if (!requestBody.currencyId) {
            return res.status(400).send({ status: false, message: `currencyId is required !` });
        }

        if (!validator.isValidString(currencyId)) {
            if (currencyId != "INR") {
                return res.status(400).send({ status: false, message: `currencyId must be valid !` })
            }
            else {
                return res.status(400).send({ status: false, message: `currencyId must be filled` })
            }
        }

        if (!requestBody.currencyFormat) {
            return res.status(400).send({ status: false, message: `currencyFormat is required!` });
        }

        if (!validator.isValidString(currencyFormat)) {
            if (currencyFormat != "₹") {
                return res.status(400).send({ status: false, message: `currencyFormat must be valid !` })
            }
            else {
                return res.status(400).send({ status: false, message: `currencyFormat must be filled` })
            }
        }

        if (isFreeShipping !== 'true' && isFreeShipping != 'false') {
            return res.status(400).send({ status: false, message: `isFreeShipping must be in boolean` })
        }

        if (!validator.isValidString(style)) {
            return res.status(400).send({ status: false, message: `style must be filled !` })
        }

        let availableSizesInArray = availableSizes.map(x => x.trim())
        console.log(availableSizesInArray)
        for (let i = 0; i < availableSizesInArray.length; i++) {
            if (["S", "XS", "M", "X", "L", "XXL", "XL"].indexOf(availableSizesInArray[i]) == -1) {
                return res.status(400).send({ status: false, message: `AvailableSizes contains ['S','XS','M','X','L','XXL','XL'] only` })
            } else {
                requestBody["availableSizes"] = availableSizesInArray
            }
        }

        if (!validator.isValidString(installments)) {
            return res.status(400).send({ status: false, message: `installements must be filled !` })
        }

        if (!validator.isValidString(isDeleted)) {
            if (isDeleted !== 'true' && isDeleted !== 'false') {
                return res.status(400).send({ status: false, message: `isDeleted must be filled` })
            }
        }

        //creating the AWS link
        let files = req.files
        if (files && files.length > 0) {
            requestBody["productImage"] = await aws.uploadFile(files[0])
        } else {
            return res.status(400).send({ status: false, message: `please provide profile pic ` })
        }

        let product = await productModel.create(requestBody)
        return res.status(201).send({ status: true, message: 'Product created Succesfully !', data: product })
    }
    catch (error) {
        res.status(500).send({ status: false, message: "Error", error: error.message })
    }
}

//***********************************************************getproductdetailAPI***********************************************************//
const getProducts = async (req, res) => {
    try {
        const requestQuery = req.query

        const { size, name, priceGreaterThan, priceLessThan, priceSort } = requestQuery

        const finalFilter = [{ isDeleted: false }]
        if (validator.isValidString(name)) {
            finalFilter.push({ title: { $regex: name, $options: 'i' } })
        }
        if (validator.isValidString(size)) {
            if (["S", "XS", "M", "X", "L", "XXL", "XL"].indexOf(size) == -1) {
                return res.status(400).send({ status: false, message: `size must be valid` })
            }
            finalFilter.push({ availableSizes: size })
        }
        if (validator.isValidNumber(priceGreaterThan)) {
            finalFilter.push({ price: { $gt: priceGreaterThan } })
        }
        if (validator.isValidNumber(priceLessThan)) {
            finalFilter.push({ price: { $lt: priceLessThan } })
        }

        if(priceSort) {
        if (validator.isValidNumber(priceSort)) {

            if (priceSort != 1 && priceSort != -1) {
                return res.status(400).send({ status: false, message: `pricesort must be 1 or -1` })
            }

            const filteredProductsWithPriceSort = await productModel.find({ $and: finalFilter }).sort({ price: priceSort })

            if (Array.isArray(filteredProductsWithPriceSort) && filteredProductsWithPriceSort.length === 0) {
                return res.status(400).send({ status: false, message: `data not found` })
            }

            return res.status(200).send({ status: true, message: `product with sorted price`, data: filteredProductsWithPriceSort })
        }
     }

        //if there is not pricesort
        const filteredProducts = await productModel.find({ $and: finalFilter })

        if (Array.isArray(filteredProducts) && filteredProducts.length === 0) {
            return res.status(400).send({ status: false, message: `data not found` })
        }

        return res.status(200).send({ status: true, message: `products without sorted price`, data: filteredProducts })

    }
    catch (error) {
        res.status(500).send({ status: false, message: "Error", error: error.message })
    }
}

//********************************************************************getProductAPI***********************************************************//
const getProductprofile = async (req, res) => {
    try {
        let { productId: _id } = req.params;

        if (!validator.isValidObjectId(_id)) {
            return res.status(400).send({ status: false, message: `Invalid ID!` })
        }

        const productData = await productModel.findById(_id);
        if (!productData) {
            return res.status(404).send({ status: false, message: `${_id} is not present in DB!` })
        }

        const productDetail = await productModel.findById({ _id: _id, isDeleted:false });
        res.status(200).send({ status: true, message: `Product Profile details`, data: productDetail })
    }
    catch (error) {
        res.status(500).send({ status: false, message: "Error", error: error.message })
    }
}

//**************************************************************updateProductAPI**************************************************************//
const updateProductById = async (req, res) => {
    try {
        let { productId: _id } = req.params
        let requestBody = req.body

        let { title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments } = requestBody
        let finalFilter = {}

        if (!validator.isValidRequestBody(requestBody)) {
            return res.status(400).send({ status: false, message: `Atleast one input is required to update` })
        }

        if (!validator.isValidObjectId(_id)) {
            return res.status(400).send({ status: false, message: `Invalid ID!` })
        }
        if (title) {
            if (!validator.isValidString(title)) {
                return res.status(400).send({ status: false, message: `title must be filled!` });
            }
            const isTitleUnique = await productModel.findOne({ title: title });
            if (isTitleUnique) {
                return res.status(400).send({ status: false, message: `${title} is already exist!` })
            }
            finalFilter["title"] = title
        }

        if (description) {
            if (!validator.isValidString(description)) {
                return res.status(400).send({ status: false, message: `description  must be filled` })
            }
            finalFilter["description"] = description
        }

        if (price) {
            if (!validator.isValidNumber(price)) {
                return res.status(400).send({ status: false, message: `price  must be filled` })
            }
            finalFilter["price"] = price
        }

        if (installments) {
            if (!validator.isValidNumber(installments)) {
                return res.status(400).send({ status: false, message: `installements  must be filled` })
            }
            finalFilter["intallments"] = installments
        }
        if (isFreeShipping) {
            if (isFreeShipping !== 'true' && isFreeShipping != 'false') {
                return res.status(400).send({ status: false, message: `FreeShipping   must be filled` })
            }
            finalFilter["isFreeShipping"] = isFreeShipping
        }
        if (currencyId) {
            if (currencyId != "INR") {
                return res.status(400).send({ status: false, message: `currencyId  must be valid` })
            }
            finalFilter["currencyId"] = currencyId
        }
        if (currencyFormat) {
            if (currencyFormat != "₹") {
                return res.status(400).send({ status: false, message: `currencyFormat  must be valid` })
            }
            finalFilter["currencyFormat"] = currencyFormat
        }
        if (style) {
            if (!validator.isValidString(style)) {
                return res.status(400).send({ status: false, message: `style must be filled` })
            }
            finalFilter["style"] = style
        }
        
        if (availableSizes) {
            if (availableSizes.length == 0) {
                return res.status(400).send({ status: false, message: `availableSizes should not be empty` })
            }
            if(Array.isArray(availableSizes)) {
            //removing the space if present in array
            let availableSizesInArray = availableSizes.map(x => x.trim())
            console.log(availableSizesInArray)
            for (let i = 0; i < availableSizesInArray.length; i++) {
                if (["S", "XS", "M", "X", "L", "XXL", "XL"].indexOf(availableSizesInArray[i]) == -1) {
                    return res.status(400).send({ status: false, message: `AvailableSizes contains ['S','XS','M','X','L','XXL','XL'] only` })
                } else {
                    finalFilter["availableSizes"] = availableSizesInArray
                }
            }
          } else {
            return res.status(400).send({status:false, message:`availableSizes should be in array`})
          }  
        }
        let files = req.files
        if (files && files.length > 0) {
            finalFilter["productImage"] = await aws.uploadFile(files[0])
        }

        const updatedProductDetails = await productModel.findOneAndUpdate({ _id: _id }, { $set: finalFilter }, { new: true })
        if (Object.keys(updatedProductDetails) <= 0) {
            return res.status(404).send({ status: false, message: `data not found` })
        }

        return res.status(200).send({ status: true, message: `product updated successfully `, data: updatedProductDetails })
    }
    catch (error) {
        res.status(500).send({ status: false, message: "Error", error: error.message })
    }
}

//**********************************************************************deleteAPI*************************************************************//
const deleteById = async (req, res) => {
    try {
        let { productId: _id } = req.params;
        if (!_id) {
            return res.status(400).send({ status: false, message: `Invalid ID!` })
        }

        const idAlreadyDeleted = await productModel.findOne({ _id: _id });
        if (idAlreadyDeleted.isDeleted === true) {
            return res.status(400).send({ status: false, message: `Product already deleted!` });
        }
        const productData = await productModel.findByIdAndUpdate({ _id }, { isDeleted: true, deletedAt: new Date() }, { new: true });

        res.status(200).send({ status: true, message: `Deleted Succesfully`, data: productData });

    }
    catch (error) {
        res.status(500).send({ status: false, message: "Error", error: error.message })
    }
}

module.exports = { createProduct, getProducts, getProductprofile, updateProductById, deleteById }