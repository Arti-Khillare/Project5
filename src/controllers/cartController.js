const cartModel = require('../models/cartModel');
const userModel = require('../models/userModel');
const productModel = require('../models/productModel');
const validator = require('../valid/validator');

//***************************************************************createCartAPI**************************************************************//
const createCart = async (req, res) => {
    try {

        const userId = req.params.userId
        const requestBody = req.body;

        let { cartId, productId, quantity } = requestBody
        if (!validator.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: `userID is invalid` })
        }

        if (!validator.isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: `productID is invalid` })
        }

        if (!validator.isValidNumber(quantity)) {
            return res.status(400).send({ status: false, message: `quantity must be number and present` })
        }
        if (quantity < 1) {
            return res.status(400).send({ status: false, message: `quantity must be greater than zero` })
        }

        // checking the userId and productId exists or not  in database
        const isUserExist = await userModel.findById(userId)
        if (!isUserExist) {
            return res.status(404).send({ status: false, message: `user data is not found` })
        }

        const isProductExist = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!isProductExist) {
            return res.status(404).send({ status: false, message: `product data is not found` })
        }

        //match userId in params and in jwt token (authorization)
        if (req.userId != userId) {
            return res.status(403).send({ status: false, message: `you are not authorized to perform this task` })
        }

        //--------------------------------------if cartId is exist in the requestbody it will add product to it-----------------------------------//
        if (cartId) {

            //validating cartId
            if (!validator.isValidObjectId(cartId)) {
                return res.status(400).send({ status: false, message: `cartId is invalid` })
            }
            
            // checking the cartId exists or not in database
            const isCartExist = await cartModel.findById(cartId)
            if (!isCartExist) {
                return res.status(404).send({ status: false, message: `cart data is not found ` })
            }
            if (isCartExist.userId != userId) {
                return res.status({ status: false, message: `this cart is not belongs to this userid ` })
            }
            // calculating  the total price   
            //totalPrice = product price(from product database) multiple by total number of quantity(from input)  and add totalPrice(from cart database)
            const totalPrice = isProductExist.price * quantity + isCartExist.totalPrice

            // totalItems = quantity(from input) and add totalItems (from cart database)
            const totalItems =  isCartExist.totalItems + 1

            // if product already exists in items{cart}
            let arrayOfItems = isCartExist.items

            for (let i = 0; i < arrayOfItems.length; i++) {
                if (arrayOfItems[i].productId == productId) {

                    let finalFilter = {
                        totalPrice: totalPrice
                    }

                    finalFilter[`items.${i}.quantity`] = quantity + arrayOfItems[i].quantity

                    const productToDeleteFromCart = await cartModel.findOneAndUpdate({ items: { $elemMatch: { productId: arrayOfItems[i].productId } } }, { $set: finalFilter }, { new: true })
                    return res.status(200).send({status:true,message:`product add to cart successfully`,data:productToDeleteFromCart })
                }
            }

            //when the productId do not exists in cart
            //storing in a variable what we need to update 
            const cartDataToAddProduct = {
                $push: { items: [{ productId: productId, quantity: quantity }] },//by using $push we will push the productid and quantity in items Array
                totalPrice: totalPrice,
                totalItems: totalItems
            }

            // updating the new items and totalPrice and tOtalItems
            const addToCart = await cartModel.findOneAndUpdate({ _id: cartId }, cartDataToAddProduct, { new: true })
            if (!addToCart) {
                return res.status(409).send({ status: false, message: `failed to update` })
            }
            return res.status(200).send({ status: true, message: `product add to cart successfully`, data: addToCart })
        }

        // --------------------------If cartId not exist in requestBody it will create the new cart----------------------------------------

        //     if the user is created the  cart but not give in requestBody
        const isCartAlreadyCreated = await cartModel.findOne({ userId: userId })
        if (isCartAlreadyCreated) {
            return res.status(400).send({ status: false, message: `cart already created please provide cartId` })

        }

        //  storing in a variable what we need to create
        const cartDataToCreate = {
            userId: userId, items: [{ productId: productId, quantity: quantity, }],
            totalPrice: isProductExist.price * quantity,
            totalItems: 1
        }

        // creating the new cart with adding the products
        const cartCreation = await cartModel.create(cartDataToCreate)
        if (!cartCreation) {
            return res.status(409).send({ status: false, message: "failed to create" })

        }
        return res.status(201).send({ status: true, message: "cart created", data: cartCreation })

    }
    catch (error) {
        res.status(500).send({ status: false, message: "Error", error: error.message })
    }
}

//****************************************************************updateCartAPI*****************************************************************//
const updateCart = async (req, res) => {
    try {

        const userId = req.params.userId
        const requestBody = req.body

        const { productId, cartId, removeProduct } = requestBody

        // validating the userId ,productId ,removeProduct,cartId

        if (!validator.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: `userId is invalid` })
        }

        if (!validator.isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: `productId is invalid` })
        }
        if (!validator.isValidObjectId(cartId)) {
            return res.status(400).send({ status: false, message: `cartId is invalid` })
        }
        if (!validator.isValidNumber(removeProduct)) {
            if (removeProduct !== 0 && removeProduct !== 1) {
                return res.status(400).send({ status: false, message: `removeProduct  is must present and it should be Number i.e 0 or 1` })
            }
        }

        // checking the userId , productId and cartId  exists or not  in database
        const isUserExists = await userModel.findById(userId)
        if (!isUserExists) {
            return res.status(404).send({ status: false, message: `user data not found` })
        }

        const isProductExists = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!isProductExists) {
            return res.status(404).send({ status: false, message: `product data not found` })
        }

        const isCartExists = await cartModel.findById(cartId)
        if (!isCartExists) {
            return res.status(404).send({ status: false, message: `cart data not found` })
        }

        // authorization
        if (req.userId != userId) {
            return res.status(403).send({ status: false, message: `you are not authorized` })
        }
        if (isCartExists.userId != userId) {
            return res.status({ status: false, message: `this cart is not belongs to this userid ` })
        }

        // ---------------------------------------------------------------------------------------------
        let arrayOfItems = isCartExists.items
        if (arrayOfItems.length == 0) {
            return res.status(400).send({ status: false, message: `items is empty noting to update` })
        }
        for (i = 0; i <= arrayOfItems.length; i++) {
            if (arrayOfItems[i].productId == productId) {
                if (removeProduct == 0 || isCartExists.items[i].quantity == 1) {
                    const finalFilterToDelete = {
                        $pull: { items: { productId: productId } },
                        totalPrice: isCartExists.totalPrice - isProductExists.price * isCartExists.items[i].quantity,
                        totalItems: isCartExists.totalItems - 1 
                    }

                    const productToDeleteFromCart = await cartModel.findOneAndUpdate({ items: { $elemMatch: { productId: arrayOfItems[i].productId } } }, finalFilterToDelete, { new: true })
                    return res.status(200).send({ status: true, message: `product successfully removed`, data: productToDeleteFromCart })
                }

                const finalFilterToremoveQuantity = {
                    totalPrice: isCartExists.totalPrice - isProductExists.price,
                }

                finalFilterToremoveQuantity[`items.${i}.quantity`] = isCartExists.items[i].quantity - 1

                const productToRemoveFromCart = await cartModel.findOneAndUpdate({ _id: cartId }, finalFilterToremoveQuantity, { new: true })
                return res.status(200).send({ status: true, message: `cart updated successfully`, data: productToRemoveFromCart })

            }

            return res.status(404).send({ status: false, message: `No products found with productId in cart` })

        }
    }
    catch (error) {
        res.status(500).send({ status: false, message: "Error", error: error.message })
    }
}

//********************************************************************getCartAPI**********************************************************//
const getCart = async (req, res) => {
    try{
        const userId = req.params.userId
 
        // validating the userId 
        if (!validator.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: `userId is invalid` })
        }

        // checking the userId  exists 
        const isUserExists = await userModel.findById(userId)
        if (!isUserExists) {
            return res.status(404).send({ status: false, message: `user data not found` })
        }

        // authorization
        if (req.userId != userId) {
            return res.status(403).send({ status: false, message: `you are not authorized` })
        }

        //checking userId present in cart
        const cartDetail = await cartModel.findOne({userId:userId});
        if(!cartDetail) {
            res.status(404).send({ status: false, message: `Cart Details not found`})
        }
        else {
        res.status(200).send({ status: true, message: `Cart Details`, data: cartDetail })
        }
   
    }
    catch (error) {
        res.status(500).send({ status: false, message: "Error", error: error.message })
    }
}

//********************************************************************deleteCartAPI*******************************************************//
const deleteCart = async (req, res) => {
    try{
        const userId = req.params.userId

        // validating the userId 
        if (!validator.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: `userId is invalid` })
        }

        // checking the userId  exists or not  in database
        const isUserExists = await userModel.findById(userId)
        if (!isUserExists) {
            return res.status(404).send({ status: false, message: `user data not found` })
        }

        // authorization
        if (req.userId != userId) {
            return res.status(403).send({ status: false, message: `you are not authorized` })
        }

        const isCartExist = await cartModel.findOne({userId:userId})
        if(!isCartExist){
            return res.status(404).send({status: false, message:`cart data not found`})
        }

        if (isCartExist.items.length == 0) {
            return res.status(400).send({ status: false, message: "items is already empty" })
        }

        const finalFilterforDelete = {
            items:[],
            totalItems:0,
            totalPrice:0
        }

        const cartDelete = await cartModel.findOneAndUpdate({_id:isCartExist._id},finalFilterforDelete,{new:true})
           
        return res.status(200).send({status:true, message:`cart deleted succefully`, data:cartDelete})
        

    }
    catch (error) {
        res.status(500).send({ status: false, message: "Error", error: error.message })
    }
}
module.exports = { createCart, updateCart, getCart, deleteCart }