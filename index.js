const express=require('express');
const mongoose=require('mongoose')
const app=express();
const userRoutes=require('./routes/auth')
const productRoutes=require('./routes/products');
const cartRoutes=require('./routes/cart')
const wishlistRoutes=require('./routes/wishlist')
const orderRoutes=require('./routes/order')
const paymentRoutes=require('./routes/payment');
const ProductReqRoutes=require('./routes/reqsProd')
require('dotenv').config()
const BodyParser=require('body-parser')
const ErrorHandler=require('./middleware/errorHandler')
const multer=require('multer');
const path=require('path');
const cors=require('cors')
const stripe=require('stripe')('sk_test_51LSgoUSFmHpNb8iUIm6rnGBowqIkb4cOlvXztOjGjvPXIsyeYk5WadcmM8D4QKXtU9VFguyxDxPVVfrCsKXIozkx00fnQ4x6aP')

//to parse incoming req
 app.use(BodyParser.json())

app.use(BodyParser.urlencoded({ extended: true }));

const ImageStorage=multer.diskStorage({
  destination:'profileImages',
  filename:(req,file,cb)=>{
    cb(null,file.originalname)
  }
})

const productImageStorage=multer.diskStorage({
  destination:process.env.PRODUCT_IMAGES_PATH,
  filename:(req,file,cb)=>{
    cb(null,file.originalname)
  }
})

app.use(cors())
//static path to access profile images
app.use('/profileImages',express.static(path.join(__dirname,'profileImages')))
app.use(`/productImages`,express.static(path.join(__dirname,`productImages`)))

// app.use(`/${process.env.PRODUCT_IMAGES_PATH?process.env.PRODUCT_IMAGES_PATH:'productImages'}`,
// express.static(path.join(__dirname,`${process.env.PRODUCT_IMAGES_PATH?process.env.PRODUCT_IMAGES_PATH:'productImages'}`)))

//allowing headers from clients
app.use((req,res,next)=>{
  console.log(process.env.PRODUCT_IMAGES_PATH)
    res.setHeader('Access-Control-Allow-Origin','*');
      //*:--->it will allow access for all the clients
    res.setHeader('Access-Control-Allow-Methods','GET,POST,DELETE,PUT,PATCH');

    res.setHeader('Access-Control-Allow-Headers','*');
    //allows the headers sent by the client
  next();
})

//user related routes needs to go for userRoutes
app.use('/api/user',
multer({
  storage:ImageStorage,
  limits:{
    fileSize:1000000
  }
}).single('imgurl'),userRoutes)

//products related routes
app.use('/api/products',
multer({
  storage:productImageStorage,
  limits:{
    fileSize:1000000
  }
}).single('productImg'),
productRoutes)

app.use('/api/cart',cartRoutes)

app.use('/api/wishlist',wishlistRoutes)

app.use('/api/orders',orderRoutes)

app.use('/api',paymentRoutes)

app.use('/api',ProductReqRoutes)

//error handling middleware
app.use(ErrorHandler);

const calculateOrderAmount = items => {
  // Replace this constant with a calculation of the order's amount
  // Calculate the order total on the server to prevent
  // people from directly manipulating the amount on the client
  return 1400;
};

app.post("/api/create-payment-intent", async (req, res) => {
  const { items } = req.body;
  console.log("comming")
  // Create a PaymentIntent with the order amount and currency
  const paymentIntent = await stripe.paymentIntents.create({
    amount: calculateOrderAmount(items),
    currency: "usd"
  });
  console.log("data",paymentIntent.client_secret)
  res.send({
    clientSecret: paymentIntent.client_secret
  });
});

//connecting data base
const connectDatabase=async()=>{
   try{
    const result = await mongoose.connect(
      `mongodb+srv://smitha:smitha123@cluster0.pmlfv.mongodb.net/vegetableShop?retryWrites=true&w=majority`
      );
    if(!result){
        const error=new Error('Failed to connect Database');
        throw error;
    }

    app.listen(process.env.PORT||8080)
    console.log('Database Connected!!')
   }catch(err){
    console.log('Error:---->',err)
   }
   
}

connectDatabase();
