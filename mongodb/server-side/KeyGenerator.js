const Crypto=require('crypto')
const key1=Crypto.randomBytes(32).toString('hex')
const key2=Crypto.randomBytes(32).toString('hex')
 console.table({key1,key2})