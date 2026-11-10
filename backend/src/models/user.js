const mongoose = require('mongoose');
const {Schema} = mongoose;

const userSchema = new Schema({
    firstName:{
        type:String,
        required:true,
        minLength:2,
        maxLength:20
    },
    lastName:{
        type:String,
        minLength:3,
        maxLength:20
    },
    emailId:{
        type:String,
        required:true,
        unique:true,
        trim:true,
        lowercase:true,
        immutable:true
    },
    age:{
        type:Number,
        min:6,
        max:100
    },
    role:{
        type:String,
        enum:['user','admin'],
        default:'user'
    },
    problemSolved:{
        type:[{
            type:Schema.Types.ObjectId,
            ref:'problem',
            unique:true
        }],
    },
    password:{
        type:String,
        required:true
    }
},{
    timestamps:true
})

// After this we will create a mongoose model using the schema defined above. The model will be used to interact with the 'users' collection in the MongoDB database.

// Method - 2 deleting submissions. This uses post command.
userSchema.post('findOneAndDelete', async function (userInfo) { // Execute this when findOneAndDelete is executed 
    // When user is deleted its info is sent in userInfo as a parameter.
    if (userInfo) {
      await mongoose.model('submission').deleteMany({ userId: userInfo._id });
    }
});
// Your Mongoose method                 Middleware
// findOneAndDelete()          →        findOneAndDelete
// findOneAndUpdate()          →        findOneAndUpdate
// findOne()                   →        findOne
// findByIdAndDelete()         →        findOneAndDelete  ← special
// findByIdAndUpdate()         →        findOneAndUpdate  ← special

const User = mongoose.model('user',userSchema); // user will be created with userSchema.
module.exports = User; // Now this can be used in other files by importing it.
