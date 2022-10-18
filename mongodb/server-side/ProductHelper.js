
const async = require('hbs/lib/async')
const { ObjectId } = require('mongodb')
var db = require('../configuration')
const names = require('../server-side/names')
var CollectionName = require('../server-side/names')
 
module.exports = {
  AddProduct: function (product, Image, callback) {

    var ProductObj = {
      product: product,
      Image: Image
    }

    db.get().collection(CollectionName.PRODUCTCOLLECTIONS)
      .insertOne(ProductObj).then((data) => {
        // console.log(data.insertedId)
        callback(data.insertedId)


      })
  },
  GetAllProducts: () => {
    //product taking
    return new Promise(async (resolve, reject) => {
      let Products = await db.get().collection(CollectionName.PRODUCTCOLLECTIONS).find().toArray()

      resolve(Products)
      // console.log(Products,"ithaan njan pranja prodyct");
    })


  },

  DeleteProduct:(ProuductId)=>{
    console.log(ProuductId,"n");
   // var ProductId=JSON.stringify(ProuductId)
    return new Promise(async(resolve,reject)=>{
     db.get().collection(names.PRODUCTCOLLECTIONS)
     .deleteOne({_id:ObjectId(ProuductId.ProductId)})
    }
    )
  },

  GetUsers:()=>{
    return new Promise(async(resolve,reject)=>{
        var UserCollection  = await  db.get().collection(names.USERCOLLECTIONS).find({UserAccess:"block"}).toArray()
       ///////////////////// console.log(UserCollection,"usercollection")
         
         var Unblocked= await db.get().collection(names.USERCOLLECTIONS).find({UserAccess:"Unblocked"}).toArray()
         //////////////////console.log(Unblocked,"YA");
         
         var obj={
           Blocked:UserCollection,
          Unblocked:Unblocked
         }
         resolve(obj)
    })


    
  },
  UnblockedUsers:()=>{ 
    return new Promise(async(resolve,reject)=>{
   var Unblocked= await db.get().collection(names.USERCOLLECTIONS).find({UserAccess:"Unblock"}).toArray()
    console.log(Unblocked,"YA");
})

  },

  BlockUser:(UserId)=>{
     return new Promise(async(resolve,reject)=>{
       var BlockedUsers={
        UserId:ObjectId(UserId)
      }
      db.get().collection(names.USERCOLLECTIONS)
      .updateOne({_id:ObjectId(UserId)},{$set:{UserAccess:"blocked"}})
      .then((data)=>{
     console.log(data,"jaa")
     
        resolve(data)
      })
     })

  },

  CarousalImage:(ImageArray)=>{
     return new Promise(async(resolve,reject)=>{
      var Data= await  db.get().collection(names.Carousal).find().toArray()
      console.log(Data,'h')
       if (Data[0]){
        db.get().collection(names.Carousal).drop()
        db.get().collection(names.Carousal).insertOne({ImageArray}).then((data)=>{
          console.log(  data+"inserted")
         })
       }else{
        db.get().collection(names.Carousal).insertOne({ImageArray}).then((data)=>{
          console.log(  data+"inserted")
         })
       }
     })
  }
,

GetCarousal:()=>{
  return new Promise(async(resolve,reject)=>{
    var Data= await  db.get().collection(names.Carousal).find().toArray()
    resolve(Data)
  })
}

}
