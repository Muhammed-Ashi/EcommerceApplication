var db = require('../configuration')
var CollectionName = require('../server-side/names')

const bcrypt = require('bcrypt');
var db = require('../configuration')
var names = require('../server-side/names');
///const { ObjectId } = require('mongodb');
const async = require('hbs/lib/async');
const { ObjectID } = require('bson');
const Razorpay = require('razorpay');

const dotenv = require('dotenv')
const jwt = require('jsonwebtoken');

const secret = process.env.jwtToken = '6ec9f672a73231d7853843bf37f5c84cbce9116816841436f77bf1373be8bc09'


var instance = new Razorpay({
    key_id: 'rzp_test_ipAV8YSYxbogZn',
    key_secret: 'tXrxuAzSqOnv6aBGFS2RLU01',
});
;
module.exports = {
    Signup: (UserDetails) => {
        UserDetails.UserAccess = "Unblocked"
        console.log(UserDetails, "njaaaaaaaaaa");
        return new Promise(async (resolve, rejects) => {
            var OldUser = await db.get().
                collection(names.USERCOLLECTIONS).findOne({ email: UserDetails.email })
            if (OldUser) {
                resolve(true)
                console.log('you have to loggin ');

            } else {

                UserDetails.password = await bcrypt.hash(UserDetails.password, 10)
                /// console.log(password);
                const Token = jwt.sign({
                    Name: UserDetails.FullName,
                    email: UserDetails.email
                }, secret, {
                    expiresIn: "2h",
                })

                console.log(Token, "bro iam token");
                //////////// UserDetails={JwtToken:Token}
                console.log(UserDetails);
                db.get().collection(names.USERCOLLECTIONS).insertOne(UserDetails).then((insertedId) => {
                    //resolve(insertedId.insertedId)
                    resolve(insertedId)
                })
            }
            
        })


    },
    LogIn: (UserDetails) => {


        console.log(UserDetails);

        return new Promise(async (resolve, rejects) => {

            let user = await db.get().collection(names.USERCOLLECTIONS)
                .findOne({ email: UserDetails.email })
            console.log(user);
            let Userobject = {}
            if (user) {
                bcrypt.compare(UserDetails.password, user.password).
                    then((result) => {
                        console.log(result,);
                        

                        if (result) {
                            var blocked=''
                            if(user.UserAccess=='blocked'){
                                blocked=true

                            }

                            //userobj.userStatus=true
                            Userobject.UserId = user
                            Userobject.blocked=blocked
                            
                            Userobject.UserStatus = true

                            console.log("logged successfully");
                            resolve(Userobject)
                            console.log(Userobject, "mat");
                        } else {
                            console.log('loggin failed');
                            
                            resolve({ status: false })
                        }
                    })



            } else {
               // var NotExist="you have no account"
                resolve({NotExist:false})
                
            }
            // rejects(user)
        })

    },
    CartCollections: (CartObject) => {
        //add to cart

        let PriceConvert = parseInt(CartObject.ProductPrice)

        console.log(CartObject, "price aane");



        let ProductDetails = {
            item: ObjectID(CartObject.ProductId),
            quantity: 1,
            Price: PriceConvert


        }
        let Cartobject = {
            UserId: ObjectID(CartObject.userid),
            TotalPrice: PriceConvert,
            products: [ProductDetails],

        };


        return new Promise(async (resolve, reject) => {
            console.log("why it is not working");
            const Cart = await db.get().collection(names.CARTCOLLECTIONS)
                .findOne({ UserId: ObjectID(CartObject.userid) })
            console.log(Cart)

            if (Cart) {
                var CartProduct = Cart.products
                /// console.log(CartProduct, "cheick ");
                // console.log(, "checking productid");
                var ProductExist = CartProduct.findIndex(products => products.item == CartObject.ProductId)
                if (ProductExist != -1) {
                    console.log("value is there");
                }

                else {
                    console.log("not exists");
                    db.get().collection(names.CARTCOLLECTIONS).updateOne(
                        { UserId: ObjectID(CartObject.userid) }, { $push: { products: ProductDetails } }

                    )
                    resolve({ ProductStatus: true })
                }


            } else {
                db.get().collection(names.CARTCOLLECTIONS).
                    insertOne(Cartobject)
                resolve({ NewProduct: true })
            }




        })


    },
    CartItems: (UserId) => {
        let userId = UserId._id
        console.log(UserId,"cart user id");
        return new Promise(async (resolve, reject) => {

            let CartItems = await db.get().collection(names.CARTCOLLECTIONS)
                .aggregate([
                    {
                        $match: { UserId: ObjectID(userId) }
                    },
                    { $unwind: "$products" },
                    {
                        $project: {
                            item: "$products.item",
                            quantity:
                                "$products.quantity",
                            Price: "$products.Price",
                            Total: '$TotalPrice',
                            UserId: '$UserId'

                        }
                    },

                    {
                        $lookup: {
                            from: "productcollections",
                            localField: "item",
                            foreignField: "_id",
                            as: "cartItems"
                        }
                    },
                    {
                        $project: {
                            UserId: 1, Total: 1, item: 1, quantity: 1, Price: 1, prs:
                                { $arrayElemAt: ['$cartItems', 0] }
                        }
                    },







                ]).toArray()
            //console.log(CartItems, "Cartitems checking")
            resolve(CartItems)
            // console.log(CartItems, "matched products");
        })
    },
    AddQuantity: (Details) => {
        var Productid = Details.ProductId
        var CartId = Details.CartId
        var Count = parseInt(Details.Count)

        console.log(Details, "details from ajax");
        return new Promise(async (resolve, reject) => {
            db.get().collection(names.CARTCOLLECTIONS)
                .updateOne({ _id: ObjectID(Details.CartId), 'products.item': ObjectID(Details.ProductId) },
                    { $inc: { 'products.$.quantity': Count } })

            resolve({ status: true })
        })
    },
    PriceIncrement: (data) => {

        var priceinteger = parseInt(data.Price)
        var item = toString(data.ProductId)

        //console.log(data, "ideeee");
        return new Promise(async (resolve, reject) => {
            db.get().collection(names.CARTCOLLECTIONS)
                .updateOne({ _id: ObjectID(data.Cartid), "products.item": ObjectID(data.Productid) }, {
                    $inc: { 'products.$.Price': priceinteger }
                }).then((data) => {
                    resolve(true)
                })

        })

    },

    DeleteCartItems: (DeleteDetails) => {
        return new Promise(async (resolve, reject) => {
            console.log(DeleteDetails, "delete items");
            db.get().collection(names.CARTCOLLECTIONS)
                .update({ _id: ObjectID(DeleteDetails.CartId) }
                    , { $pull: { 'products': { item: ObjectID(DeleteDetails.ProductId) } } })


            var update = await db.get().collection(names.CARTCOLLECTIONS)
                .aggregate([{ $match: { _id: ObjectID(DeleteDetails.CartId) } },
                ]).toArray()
            console.log(update, "new expirim");

        })



    },
    TotalProductAmount: (CartId) => {
        console.log(CartId, "daa njan cartid")
        return new Promise(async (resolve, reject) => {
            var array = await db.get().collection(names.CARTCOLLECTIONS)
                .aggregate([
                    {
                        $match: { _id: ObjectID(CartId.CartId) },



                    },

                    {
                        $project: {
                            all: { $concatArrays: ["$products.Price"] },
                            TotalPrice: { $sum: "$products.Price" }
                        },
                    },



                ]).toArray()
            
            var ARRAY = array[0].TotalPrice
            var integer = parseInt(ARRAY)
            console.log(ARRAY, "group expirimenteeeeeeeeaa");
            console.log(CartId, "new");

            db.get().collection(names.CARTCOLLECTIONS)

                .updateOne({ _id: ObjectID(CartId.CartId) }, { $set: { TotalPrice: integer } })
            resolve(ARRAY)
        })


    },

    SaveAddress: (AddressDetails, UserId) => {
        var UserAddress = { AddressDetails }
        console.log(AddressDetails);
        var UserAddressObject = {
            UserId: ObjectID(UserId),
            UserAddress
        }

        return new Promise(async (resolve, reject) => {
            var User = await db.get().
                collection(names.ADDRESS).findOne({ UserId: ObjectID(UserId) })
            console.log(User, "user")
            if (User) {
                console.log("its working");
                db.get().collection(names.ADDRESS).drop()


                    
                db.get().collection(names.ADDRESS).insertOne(UserAddressObject).then((data) => {

                    resolve(data)
                })
            }else{
                db.get().collection(names.ADDRESS).insertOne(UserAddressObject).then((data) => {

                    resolve(data)
                })
            }
          

        })






    },

    GetAddressCollection: (UserId) => {
        return new Promise(async (resolve, reject) => {

            var Address = await db.get().collection(names.ADDRESS).findOne({ UserId: ObjectID(UserId) })
            if (Address) {
                console.log(Address.UserAddress.AddressDetails, "obj");
                resolve(Address.UserAddress.AddressDetails)

            }
            else {
                var NoUser = "no user"
                resolve(NoUser)
            }

        })


    },
    EditAddress: (EditDetails) => {
        var EditDetailss = EditDetails

        console.log(EditDetails)
        return new Promise(async (resolve, reject) => {
            var Update = await db.get()
                .collection(names.ADDRESS).updateOne
                ({ UserId: ObjectID(EditDetails.UserId) },
                    { $set: { UserAddress: EditDetails } })
            console.log(Update, "UPDATA ADDRESS")

            resolve({ Update: true })
        })


    },

    SelectAddress: (UserId) => {
        console.log(UserId, 'fpr address');
        return new Promise(async (resolve, reject) => {
            var Address = await db.get()
                .collection(names.ADDRESS).findOne({ UserId: ObjectID(UserId) })
            //// console.log(Address.UserAddress.AddressDetails,"address data");
            if (Address) {

                var Cart = await db.get().collection(names.CARTCOLLECTIONS).aggregate([
                    { $match: { UserId: ObjectID(UserId) } },
                    { $unwind: "$products" },
                    {
                        $project:
                        {
                            item: "$products.item",
                            quantity: "$products.quantity",
                            Price: "$products.Price",
                            UserId: "$UserId",
                            TotalPrice: "$TotalPrice"
                        }
                    },


                    {
                        $lookup: {
                            from: "productcollections",
                            localField: "item",
                            foreignField: "_id",
                            as: "product"



                        }
                    },
                    { $unwind: "$product" },


                ]).toArray()
                console.log(Address, "adress");

                let Items = {
                    Address: Address,
                    Product: Cart


                }
                console.log(Cart, "njan")
                resolve(Items)
            } else {
                resolve(null)
            }
        })

    },
    PlaceOrder: (UserId, Address_Cart) => {
        return new Promise(async (resolve, reject) => {
            console.log(Address_Cart, "ass")
            /// console.log(Address_Cart,"yaa");
            let array = Address_Cart.Product
            var ProductForDelivery = []
            for (var i = 0; array.length > i; i++) {
                var item = Address_Cart.Product[i].product
                ProductForDelivery.push(item)

            }

            var OrderDetails = {
                TotalPay: Address_Cart.Product[0].TotalPrice,
                Product: ProductForDelivery,
                Address: Address_Cart.Address.UserAddress.AddressDetails,
                UserId: Address_Cart.Address.UserId,
                DeliveryStatus: 'PENDING'
            }
            db.get().collection(names.ORDER).insertOne(OrderDetails).then((Data) => {
                resolve(Data.insertedId)
                console.log(Data.insertedId, "delivey")
            })
           

        })


    },
    ViewOrder: (UserId) => {
        return new Promise(async (resolve, reject) => {
            var Order = await db.get().collection(names.ORDER)
                .aggregate([{ $match: { UserId: ObjectID(UserId) } },
                ]).toArray()
            var Orders = {
               DeliveryStatus: Order[0].DeliveryStatus,
               TotalAmount:Order[0].TotalPay,
              Product_Image: Order[0].Product


            }
         
              // console.log(Orders,"yes")

            resolve(Orders)
        })

    },
    GenerateRazorpay: (OrderId, TotalAmount) => {
        console.log("razorpay");
        return new Promise((resolve, rejcet) => {
            console.log(OrderId, "vannkmnp");
            var option = {
                amount: TotalAmount*100,
                currency: "INR",
                receipt: " " + OrderId
            };
            instance.orders.create(option, function (err, order) {
                if (err) {
                    console.log(err,'ERROR');
                    resolve(err)
                } else {
                    ////console.log(order,"success");
                    resolve(order)
                }
            })

        })

    },


    TotalProductAmountFirst: (UserId) => {

        console.log(UserId, "daa njan cartid")
        return new Promise(async (resolve, reject) => {
            var Cart = await db.get().collection(names.CARTCOLLECTIONS)
                .findOne({ UserId: ObjectID(UserId) })
            console.log(Cart, "daaa")
            if (Cart) {
                var array = await db.get().collection(names.CARTCOLLECTIONS)
                    .aggregate([
                        {
                            $match: { UserId: ObjectID(UserId) },
                        },

                        {
                            $project: {
                                all: { $concatArrays: ["$products.Price"] },
                                TotalPrice: { $sum: "$products.Price" }
                            },
                        },



                    ]).toArray()

                console.log(array, "my");
                var ARRAY = array[0].TotalPrice
                var integer = parseInt(ARRAY)
                console.log(ARRAY, "group expirimenteeeeeeeeaa");

                db.get().collection(names.CARTCOLLECTIONS)

                    .updateOne({ UserId: ObjectID(UserId) }, { $set: { TotalPrice: integer } })
                resolve(ARRAY)
            } else {
                resolve({ Result: false })
            }

        })
    },
    CategoryView: (Category) => {

        return new Promise(async (resolve, reject) => {
            let Documents = await db.get()
                .collection(names.PRODUCTCOLLECTIONS).find({ "product.Category": Category }).toArray()
            resolve(Documents)
            console.log(Documents);
        })
    },

    VarifyPayment: (Details) => {
        console.log(Details, 'vsti');
        return new Promise(async (resolve, reject) => {
            const {
                createHmac,
            } = await import('crypto');

            var hmac = createHmac('sha256', 'tXrxuAzSqOnv6aBGFS2RLU01');

            hmac.update(Details['Payment[razorpay_order_id]'] + '|' + Details['Payment[razorpay_payment_id]']);
            hmac = hmac.digest('hex')
            if (hmac == Details['Payment[razorpay_signature]']) {
                console.log('Payment successfull');
                resolve({ response })
            } else {
                console.log('payment Failed')
                reject()
            }

        })
    },

    ChangeOrderStatus: (UserId) => {
        db.get().collection(names.ORDER)
            .updateOne({ UserId: ObjectID(UserId) }, { $set: { OrderStatus: "Placed" } })
    },

    ProductProfile: (ProductId) => {
        return new Promise(async (resolve, reject) => {
            var Product = await db.get().collection(names.PRODUCTCOLLECTIONS)
                .findOne({_id:ObjectID(ProductId)})
                resolve(Product)
        })

    },
    GetUserProfile: (UserId) => {
        return new Promise(async (resolve, reject) => {
            var User = await db.get().collection('UserDetails')
                .findOne({ UserId: UserId})
                
            resolve(User)
            //console.log(User,"bijumenon")
        })
    },
    EditUserProfile: (ProfilePicture, UserDetails, UserId) => {
        
        var UserDetails = UserDetails
        return new Promise(async (resolve, reject) => {
            var User = await db.get().collection('UserDetails')
                .findOne({UserId:UserId})

                 if (User){
                    db.get().collection("UserDetails").deleteOne({UserId:UserId})
                    db.get().collection("UserDetails").insertOne({ProfilePicture,UserDetails,UserId})
                resolve()
 
                 }else{
                    db.get().collection("UserDetails").insertOne({ProfilePicture,UserDetails,UserId})
                    resolve()
     
                 }
             
               



        })

    },
    GmailSignup: (UserData) => {
        return new Promise(async (resolve, reject) => {
            console.log(UserData);
            var UserExist = await db.get().collection(names.USERCOLLECTIONS)
                .findOne({ email: UserData.email })
            if (UserExist) {
                resolve(UserExist)
                //console.log(UserExist);
            } else {
                db.get().collection(names.USERCOLLECTIONS).insertOne(UserData)
                    .then((data) => {
                        resolve(data)
                    })
            }

        })
    },
    CancelOrder: (OrderId, callback) => {

        db.get().collection(names.ORDER).deleteOne({ _id: ObjectID(OrderId.OrderId) })
        return callback({ status: true })
        console.log(data);

    },
    Increment_Decrement_price: (Details) => {

        console.log(Details, " new idea")
        return new Promise(async (resolve, reject) => {


          var data= await  db.get().collection(names.CARTCOLLECTIONS)
                .findOne({ _id: ObjectID(Details.Cartid) })


                    resolve(data)
                

        })

    },

    GetCart:(UserId)=>{
       return new Promise(async(resolve,reject)=>{
        var Cart=   await   db.get().collection(names.CARTCOLLECTIONS).findOne({
                UserId:ObjectID(UserId)
                
               })

               console.log(Cart)
               resolve(Cart)
        })

    }

}
