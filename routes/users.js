var express = require('express');
const res = require('express/lib/response');
const UserHelper = require('../mongodb/server-side/UserHelper');
var router = express.Router();
var ProductHelper = require('../mongodb/server-side/ProductHelper')
const Razorpay = require('razorpay');
var app = require("../app");
const async = require('hbs/lib/async');
const passport = require('passport')
const multer = require('multer');
const { json } = require('body-parser');
var PassportSetup = require('./PassportSetup')
// Set storage engine
const storage = multer.diskStorage({
  destination: './public/images',
  filename: function (req, file, cb) {
    // null as first argument means no error
    cb(null, file.originalname)
  }
})

// Init upload
const upload = multer({
  storage: storage,


})


/* GET users listing. */
router.get('/', function (req, res, next) {

  if (req.session.status) {

    var UserSession = req.session.userID.email
    ProductHelper.GetAllProducts().then(async(products) => {
     var Data= await ProductHelper.GetCarousal()
    var Carousal=Data[0].ImageArray
     console.log('carousal',Data[0].ImageArray)
      //  console.log(products, "products form user");
      res.render('users/test', { UserSession, products,Carousal })
    })

    //console.log(UserSession,"daaaaaaaaaaaa");

  } else {
    res.redirect('/login')
  }

});

router.get('/login', (req, res) => {
  console.log("iam");
  res.render('users/Login')
})

router.get('/GmailLogin', passport.authenticate('google', { scope: ['profile', 'email'] }))
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
  if (res) {
    console.log(req.user, "iam that");
    req.session.status = true
    req.session.userID = req.user
    res.redirect('/')
  }

})

router.post('/login', (req, res) => {
  UserHelper.LogIn(req.body).then((user) => {
    //console.log(user,'new');
    if (user.UserStatus == true) {
      req.session.userID = user.UserId
      req.session.status = true
      console.log(req.session.userID, "session");
      res.redirect('/')
    } else {
      //console.log("are you workifngi")
      res.render('users/Signup')

    }



  })

})
router.get('/signup', (req, res) => {
  console.log(req.query, "quwert");

  res.render('users/Signup')
})
router.post('/signup', (req, res) => {
  UserHelper.Signup(req.body).then((userID) => {
    // console.log(userID);
    if (userID){
      res.redirect("/login")
    }
  
  })
  // console.log(req.body);
})
router.get('/logout', (req, res) => {
  req.session.destroy(),
    res.redirect('/login')
})
router.post("/cart", (req, res) => {

  req.body.userid = req.session.userID._id
  /////// console.log(req.body,"testing");
  UserHelper.CartCollections(req.body).then(() => {
    ///console.log("THIS IS CARTPRODUCTS");
    res.redirect("/cart-page")
  })


})
router.get('/cart-page', (req, res) => {
  var UserId = req.session.userID._id
  UserHelper.TotalProductAmountFirst(UserId)
  UserHelper.CartItems(req.session.userID).then((CartItems) => {
    var length=CartItems.length

    res.render("users/cartpage", { CartItems, UserId,length })
  

    console.log(length, "cartid che");



  })

})
router.post('/AddQuantity', (req, res) => {
  //console.log(req.body,"idi");
  UserHelper.AddQuantity(req.body).then((data) => {

    res.json(data)

  })


  // res.redirect('/cart-page').
}),
  router.post('/PriceIncrement', (req, res) => {
    // console.log(eq.body, "expiriment");
    UserHelper.PriceIncrement(req.body).then(async (PriceIncrement) => {
      // var PriceIncrement = PriceIncrement.products[0]
      // console.log(PriceIncrement,"priceincrement");
      var UserId = req.session.userID._id
      var data = await UserHelper.Increment_Decrement_price(req.body)
      var CartId = { CartId: data._id }
     
      var Total = await UserHelper.TotalProductAmount(CartId)
      console.log(Total)

      
      res.json({ data, Total })




    })
  })


router.post("/DeleteCartItems", (req, res) => {
  UserHelper.DeleteCartItems(req.body)
  //console.log(req.body)

})
router.post('/TotalProductAmount', (req, res) => {
  ///// console.log(req.body,"total product")
  UserHelper.TotalProductAmount(req.body)
})

router.get('/address', (req, res) => {
  UserHelper.GetAddressCollection(req.session.userID._id).then((User) => {
    console.log(User,'this is adress')
                 res.render('users/address',{User})
  })

})
router.post("/Address", (req, res) => {
  console.log(req.body, "saviiiiiiiiii")


  UserHelper.SaveAddress(req.body, req.session.userID._id).then((insertedId) => {

     res.render('users/PaymentPage')

  })
})

router.get('/EditAddress', (req, res) => {
  res.render('users/EditAddress')
})
router.post('/EditAddress', (req, res) => {
  req.body.UserId = req.session.userID._id
  UserHelper.EditAddress(req.body).then((Update) => {
    if (Update == true) {
      res.render('/EditAddress')
    }
    else {
      console.log("not working")
      UserHelper.SelectAddress(req.session.userID._id).then((Address) => {
        if (Address) {
          console.log(Address);
          res.render('users/ChooseAddress', { Address })
        } else {
          console.log("yaaaaaaaaaaaaa");
          res.render('users/AddAddress')
        }
      })

    }


  })


})
router.get('/ChooseAddress/:id', (req, res) => {
  // console.log(req.params.id,"select")
  UserHelper.SelectAddress(req.params.id).then((Address) => {
    // console.log(Address.Product,"modified");
    // console.log(Address.Product[0].first,"pro");
    if (Address) {
      res.render('users/ChooseAddress', { Address })
    } else {
      res.render('users/AddAddress')
    }
  })
}),
  router.get('/PaymentPage', (req, res) => {
    var UserId = req.session.userID._id
   UserHelper.GetCart(UserId).then((data)=>{
    console.log(data.TotalPrice)
    res.render('users/PaymentPage',{data})
   })
   
  })

router.post('/PlaceOrder', async (req, res) => {
 
  var Address = await UserHelper.SelectAddress(req.session.userID._id)
  var TotalPrice = Address.Product[0].TotalPrice
  console.log(Address.Product[0].TotalPrice)
  UserHelper.PlaceOrder(req.session.userID._id, Address)
    .then((OrderId) => {
      if (req.body.name === "Razorpay") {
        console.log(OrderId,"orderid ")
        
        UserHelper.GenerateRazorpay(OrderId, TotalPrice)
         
         .then((response) => {
             console.log(response,'hry thid');
               res.json(response)

          })
      } else {
        console.log("cash on delivery");
        res.json({ Success: true })
      }
    })

  //console.log(Address,"new ");

  // res.redirect('/PaymentPage')

})
router.get('/PlaceOrder', (req, res) => {
  res.render('users/OrderPlaced')
})
router.get('/ViewOrder', (req, res) => {
  UserHelper.ViewOrder(req.session.userID._id).then((Order) => {
     var Product=Order[0]
    console.log(Order,"usecases")
  
    res.render('users/Order', { Order })
  })

})
router.post("/VarifyPayment", (req, res) => {
  console.log(req.body, "checc")
  UserHelper.VarifyPayment(req.body).then(() => {
    UserHelper.ChangeOrderStatus(req.session.userID._id)

  })
})
//category
router.get('/CategoryView/:id', (req, res) => {
  console.log(req.params.id);
  var Category = req.params.id
  UserHelper.CategoryView(Category).then((Products) => {
    res.render('users/CategoryPage', { Products })
  })
})


router.get('/ProductProfile/:id', (req, res) => {
  console.log(req.params.id);
  var ProductId = req.params.id
  UserHelper.ProductProfile(ProductId).then(async(Product) => {
    let length= await UserHelper.CartItems(req.session.userID)
    var Length=length.length
    console.log(Product,Length ,'THIS IS FOR PRODUCT PROFILE')
    res.render('users/Product', { Product,Length })
  })



})

router.get('/UserProfile', (req, res) => {
  UserHelper.GetUserProfile(req.session.userID._id).then((User) => {
    console.log(User, "iam user profile");
    res.render('users/UserProfile', { User })
  })
})
router.get('/EditUserProfile', (req, res) => {
  res.render('users/EditUserProfile')
})
router.post('/EditUserPage', upload.array('ProfilePicture', 1), (req, res) => {
  console.log(req.body);
  console.log(req.files,"user profile");
  //var UserDetails = req.body
  var ProfilePicture = req.files[0].originalname
  ///;
  UserHelper.EditUserProfile(ProfilePicture, req.body, req.session.userID._id)
  res.redirect('/UserProfile')
})
router.post('/CancelOrder', (req, res) => {
  console.log(req.body, "cancoe");
  UserHelper.CancelOrder(req.body, (callback) => {
    res.json({ DeleteStatus: true })
  })

})


module.exports = router;
