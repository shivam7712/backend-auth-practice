import express from 'express'
import mongoose from 'mongoose'
import 'dotenv/config'
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'
import path from 'path'
import cors from 'cors'
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

const dbURI = process.env.MONGO_URI
const jwt_key = process.env.JWT_SECRET


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

const auth = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        if(!authHeader) {
            return res.status(401).json({msg: "no token found"});
        }
        const token = authHeader.split(' ')[1];
       
        const decoded = jwt.verify(token, jwt_key)
        req.userId = decoded.id;
        next()
    }
    catch(err) {
        console.log(err.message)
        return res.status(401).json({msg: "invalid token"});
    }
}

(async()=>{
    try {
        await mongoose.connect(dbURI);
        console.log("connection successfull")

    }
    catch(err) {
        console.log(err.message);
        
    }
})()

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

app.post("/signin", async (req, res)=>{
    try {
        console.log(req.body)
        const {username, password} = req.body;
        const specificUser = await User.findOne({
            username: username
        })

        if(!specificUser) {
            return res.status(401).json({msg: "username not found"})
        }

        const isTrue = await bcrypt.compare(password, specificUser.password)
        if(!isTrue) {
            return res.status(401).json({msg: "password is incorrect"});
        }
        
        const token = jwt.sign({id: specificUser._id}, jwt_key, {expiresIn: '15m'});
        res.json({
            msg: `login success`,
            token: token
        });
        
    }
    catch(err) {
        console.log(err.message)
        res.status(500).json({msg: `server error`});
    }
    
    
})

app.post("/todo", auth, async(req, res)=>{
    
    try {
        const title = req.body.title;
        if(!title) {
            return res.status(401).json({msg: "title not found"});
        }

        await Todo.create({
            userId: req.userId,
            title: title
        })
        res.json({msg: "added todo"});
    }
    catch(err) {
        console.log(err.message)
        res.status(500).json({msg: "server error"})
    }


})

app.get('/todos', auth, async(req, res)=>{
    try {
        const todos = await Todo.find({userId: req.userId});
       
        console.log(todos)
        res.json({
            msg: "success",
            tasks: todos
        })
    }
    catch(err) {
        console.log(err.message)
    }
    

})

app.listen(8000, ()=> console.log(`server is running on port 8000`));
