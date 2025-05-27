const mongoose = require("mongoose")
mongoose.connect('mongodb://0.0.0.0:27017/gymBackend')
.then(()=> console.log('DB connection successfull!')).catch(err=>{
    console.log(err)
});