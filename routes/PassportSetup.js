const passport=require('passport')
const UserRouter=require('./users')
const UserHelper = require('../mongodb/server-side/UserHelper');
const async = require('hbs/lib/async');
const GoogleStrategy=require('passport-google-oauth2').Strategy



passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

 

passport.use(new GoogleStrategy({
clientID:"740040735860-74n8gte2t2qu07ps8uvce3m2drp3jol1.apps.googleusercontent.com",
clientSecret:"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",
callbackURL:"http://deostore.online/google/callback",
passReqToCallback:true
},async function (req,accessToken,refreshToken,profile,done){
  
 /////  console.log(profile);

        const UserData={
          Fullname:profile._json.name,
          ProfilePicture:profile._json.picture,
          email:profile._json.email
          
        }
           
          const UserDetails= await UserHelper.GmailSignup(UserData)
          
           req.Userr=UserDetails
    return done(null,UserDetails)
     
   
}))


 