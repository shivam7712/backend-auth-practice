import express from 'express'
import mongoose from 'mongoose'
import 'dotenv/config'
import bcrypt from 'bcrypt';

const app = express();
app.use(express.json());

const dbURI = process.env.MONGO_URI
const jwt_key = process.env.JWT_SECRET


console.log(dbURI)

const userSchema = new mongoose.Schema({
    name: {type: String, required: true},
    username: {type: String, required: true, unique: true},
    password: {type: String, required: true}
})

const todoSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {type: String, required: true},
    done: {type: Boolean, default: false}
})

const User = mongoose.model('User', userSchema);
const Todo = mongoose.model('Todo', todoSchema);


const checkDuplicateUser = async (req, res, next) => {

    try {
        const {username} = req.body;
        const isExist = await User.exists({username: username});

        if(isExist) {
            return res.status(401).json({msg: "User already exists"});
        }
        console.log("auth success");
        next();

    }catch(err) {
        console.log(err.message);
        res.status(500).json({msg: "server Error"})
    }
    
}

app.post("/signup", checkDuplicateUser, async(req, res)=>{
    try{
        const {name, username, password} = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);

        await User.create({
            name: name,
            username: username,
            password: hashedPassword
        })

        res.json({msg: "user created successfully"});
    }
    catch(err) {
        console.log(err.message)
        res.status(500).json({msg: "sever error"})
    }
    
})

const startServer = async()=>{
    try {
        await mongoose.connect(dbURI);
        console.log("connection successfull")

        app.listen(8000, ()=>{
            console.log("server is running on 8000");
        })
    }
    catch(err) {
        console.log(err.message);
        
    }
}

startServer()
