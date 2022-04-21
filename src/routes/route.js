const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController')
const productController = require('../controllers/productController')
const cartController = require('../controllers/cartController');
const orderController = require('../controllers/orderController')
const middleware = require('../middleware/auth')


//* featureI UserAPI's*//
//register API
router.post('/register', userController.createUser)

//login API
router.post('/login' , userController.userLogin)

//get profile API
router.get('/user/:userId/profile',middleware.auth, userController.getUserprofile)

//update profile API
router.put('/user/:userId/profile',middleware.auth,userController.updateProfile)

//* featureII ProductAPI's*//
//createProduct API
router.post('/products' , productController.createProduct)

//getProductdetail API
router.get('/products' , productController.getProducts)

//getProductprofilebyId API
router.get('/products/:productId',productController.getProductprofile)

//updateProductbyId API
router.put('/products/:productId', productController.updateProductById)

//delete productbyId API
router.delete('/products/:productId', productController.deleteById)

/*----featureIII CartAPI's----*/
//CreateAPI's
router.post('/users/:userId/cart',middleware.auth, cartController.createCart)

//update cart API
router.put('/users/:userId/cart', middleware.auth, cartController.updateCart)

//getCart
router.get('/users/:userId/cart',middleware.auth, cartController.getCart)

//deleteCart
router.delete('/users/:userId/cart',middleware.auth, cartController.deleteCart)

/*----featureIV OrderAPI's----*/
//createOrder API
router.post('/users/:userId/orders',middleware.auth, orderController.createOrder)

//updateOrder API
router.put('/users/:userId/orders',middleware.auth,orderController.updateOrder)

module.exports = router;