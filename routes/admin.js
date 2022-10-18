var express = require('express');
var router = express.Router();
var ProductHelper = require('../mongodb/server-side/ProductHelper')
const multer = require('multer');
const { json } = require('body-parser');
const async = require('hbs/lib/async');
const swal=require('sweetalert2')





// Set storage engine
const storage = multer.diskStorage({
  destination: './public/images',
  filename: function (req, file, cb) {
    // null as first argument means no error
    cb(null,  file.originalname)
  }
})

// Init upload
const upload = multer({
  storage: storage,
 
 
})

/* GET home page. */
 router.get('/',(req,res)=>{
  res.render('admins/Admin_dashboard')

 })

router.get('/Product_list', function (req, res, next) {
  ProductHelper.GetAllProducts().then((products) => {
   ///// var image=products[0].Image
   ///  var myArray = JSON.parse(image);
    //////////console.log(products[0].Image,"data from database");
    //////console.log(image);
   console.log(products);
   
    ///console.log(productobjects, "data from database");
    res.render('admins/admin', { products, });
  })

});
router.get('/addProduct', function (req, res, next) {
  res.render('admins/addProduct')
})
router.post('/addProduct',upload.array('img',3), (req, res) => {
 // res.send("uploaded")
   console.log(req.body,"multer result");
    
   let ProductDetailes=req.body
   let ImgName=req.files

    var ImageArray=[]
   for (i=0;ImgName.length>i;i++){
     
       var name= ImgName[i].originalname
       ImageArray.push(name)
      /// ImageArray.push(ProductDetailes)
   }
  console.log(ImageArray,"array ");
  
   


  ProductHelper.AddProduct(req.body ,ImageArray, (ProductID) => {
console.log(ProductID,"iam productId");
       res.redirect('/admin/ProductManagement')
  })



})

router.post("/Delete",(req,res)=>{
    console.log(req.body)
     ProductHelper.DeleteProduct(req.body)
})
 router.get('/GetUsers',async(req,res)=>{
  
     ProductHelper.GetUsers().then((obj)=>{
      
      var blocked=obj.Blocked
      var Unblocked=obj.Unblocked
      console.log(obj,"da");
       res.render('admins/UserManagement',{blocked,Unblocked})
    })
  
   
   
    
   
 })

 router.post('/BlockUser',(req,res)=>{
  console.log(req.body)
  ProductHelper.BlockUser(req.body.UserId).then((data)=>{
    console.log(data);
    if (data.acknowledged==true){
       res.json({status:true})
    }
  }) 
 })
 router.get('/ProductManagement',(req,res)=>{
   res.render('admins/addprorducts')
 })

 router.get('/offer',(req,res)=>{
   res.render('admins/OfferMangement')
 })

 router.post('/addCarousal',upload.array('img',3),(req,res)=>{
   console.log(req.files[0].originalname,"love")
    var Images=req.files
    
  var ImageArray=[]
   for ( var i=0;Images.length>i;i++){
    var name=Images[i].originalname
    ImageArray.push(name)
    
   }

    console.log(ImageArray)

     ProductHelper.CarousalImage(ImageArray).then((data)=>{
        res.redirect('admin/addCarousal')
     })
 })
 router.post('/AddOffer',(req,res)=>{
  console.log(req.body)
     res.render('admins/testing')

 })
  
module.exports = router;
