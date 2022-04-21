const express = require('express');
const bodyParser = require('body-parser');
const route = require('./routes/route.js');
const multer = require('multer')
const  mongoose  = require('mongoose');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(multer().any())

mongoose.connect("mongodb+srv://ArtiKhillare:jR067NcnClM96Fp1@cluster0.wi9j2.mongodb.net/group16Database?retryWrites=true&w=majority", {
    useNewUrlParser : true,useUnifiedTopology: true,useCreateIndex: true, useFindAndModify: true


})
.then( () => console.log( "MongoDb is successfully connected"))
.catch( err => console.log(err) )

app.use('/', route);

app.listen(process.env.PORT || 3000, function () {
    console.log('Express app running on port ' +(process.env.PORT || 3000))
});