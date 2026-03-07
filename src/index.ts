import express from "express";
import { UserModel } from "./db.js";
import jwt from 'jsonwebtoken';
import { z } from "zod";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET as string;
const app = express();
app.use(express.json());

const signupSchema = z.object({
  username: z.string(),
  password: z.string().min(6)
});

const signinSchema = z.object({
  username: z.string(),
  password: z.string()
});

//route to signup
app.post("/api/v1/signup", async(req, res) => {
    //zod validation and hash the password
   
    try{
        const parsed = signupSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
            message: "Invalid input"
            });
        }

        const { username, password } = parsed.data;
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
    
        await UserModel.create({
            username: username,
            password: hashedPassword
        })

        res.json({
            message: "User signed up"
        })
    }
    catch(e) {
        res.status(411).json({
            message: "User already exists"
        })
    }
})

//route to signin
app.post("/api/v1/signin", async (req, res) => {
    //use JWT
    try {
        // Validate input
        const parsed = signinSchema.safeParse(req.body);

        if (!parsed.success) {
            return res.status(400).json({
            message: "Invalid input"
            });
        }
        const { username, password } = parsed.data;
        const existsUser = await UserModel.findOne({ username });

        if (!existsUser) {
            return res.status(403).json({
            message: "User does not exist"
            });
        }

        // if (!existsUser.password) {
        // return res.status(500).json({
        //     message: "Password not found for user"
        // });
        // }

        //Check password with hash
        const match = await bcrypt.compare(password, existsUser.password);

        if(!match) {
            return res.status(403).json({
                message: "Incorrect password"
            })
        }        
            
        const token = jwt.sign({
            id: existsUser._id
        }, JWT_SECRET)

        res.json({
            message: "You are signed in",
            token: token
        })
        
    } catch(e) {
        res.status(401).json({
            message: "Sign in failed"
        })
    }  
    
})

//route to post content on second brain
app.post("/api/v1/content", (req, res) => {
    
})

//route to get content
app.get("/api/v1/content", (req, res) => {

})

//route to delete content
app.delete("/api/v1/content", (req, res) => {
    
})

//route to share user's second brain
app.post("/api/v1/brain/share", (req, res) => {

})

//route to share a link/particular content from second brain to someone else
app.get("/api/v1/brain/:shareLink", (req, res) => {

})

app.listen(3000);