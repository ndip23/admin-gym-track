const mongoose = require("mongoose");

mongoose.connect('mongodb://0.0.0.0:27017/gymBackend')
.then(() => console.log('DB connection succesfull'))
.catch(err=>{
    console.log(err)
})