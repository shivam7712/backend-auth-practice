import express from 'express'
import mongoose from 'mongoose'
import 'dotenv/config'

const app = express();
app.use(express.json());

const dbURI = process.env.MONGO_URI
const jwt_key = process.env.JWT_SECRET

console.log(dbURI);
console.log(jwt_key);



const userSchema = new mongoose.Schema({
    name: {type: String, required: true},
    username: {type: String, required: true, unique: true},
    password: {type: String, required: true}
})

const todoSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    title: String,
    done: Boolean
})

const User = mongoose.model('User', userSchema);
const Todo = mongoose.model('Todo', todoSchema);

app.post("/signup", authUser, (req, res)=>{
    
})
app.listen(8000);

