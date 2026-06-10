import express from "express";
import { ContentModel, LinkModel, UserModel } from "./db.js";
import jwt from 'jsonwebtoken';
import { z } from "zod";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { userMiddleware } from "./middleware.js";
import { random } from "./utils.js";

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

//signup
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
            message: "Error signing up"
        })
    }
})

//signin
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

//post content on second brain (authenticated)
app.post("/api/v1/content", userMiddleware, async (req, res) => {
    try{
        const title = req.body.title;
        const link = req.body.link;
        //const tags = req.body.tags;
        //@ts-ignore
        const userId = req.userId;   //provided by the middleware who will check the token

        await ContentModel.create({
            title,
            link, 
            tags: [],
            userId
        })

        res.json({
            message: "Content added"
        })
    }
    catch(e) {
        res.json({
            message: "Error"
        })
    }
})

//get all content of the user (authenticated) 
app.get("/api/v1/content", userMiddleware, async (req, res) => {
    try{
        //@ts-ignore
        const userId = req.userId;
        const content = await ContentModel.find({
            userId: userId
        }).populate("userId", "username")

        res.json({
            content
        })
    }catch(e) {
        res.json({
            message: "Content not available"
        })
    }

})

//delete content (authenticated)
app.delete("/api/v1/content", userMiddleware, async(req, res) => {
    try{
        //@ts-ignore
        const userId = req.userID;
        const contentId = req.body.contentId;
        await ContentModel.deleteMany({
            contentId: contentId,
            userId: userId
        })

        res.json({
            message: "Content deleted"
        })
    }catch(e){
        res.json({
            message: "Error deleting"
        })
    }
    
})

//share user's second brain (authenticated)
app.post("/api/v1/brain/share", userMiddleware, async (req, res) => {
    try{
        const share = req.body.share;
        const existingLink = await LinkModel.findOne({
                //@ts-ignore
                userId: req.userId
            })
        //enable or disable link sharing
        if(share === true) {        

            if(existingLink) {
                res.json({
                    shareLink: existingLink.hash
                })
                return;
            }

            //generate a sharable link if share is true only if link does not exist
            const hash = random(10)
            await LinkModel.create({
                //@ts-ignore
                userId: req.userId,
                hash: hash
            })
            res.json({
                message: "Created sharable link",
                shareLink: hash
            })
        }
        else {    //is share is false then disable the link (delete from db)
            if(existingLink) {
                await LinkModel.deleteOne({
                //@ts-ignore
                userId: req.userId
                })
                res.json({
                    message: "Removed sharable link"
                })
            }
            
            else {
                res.json({
                    message: "Link does not exist"
                })
            }
        }
    } catch(e) {
        res.json({
            message: "Error sharing link"
        })
    }
})

//fetch another user's shared brain content
app.get("/api/v1/brain/:shareLink", async (req, res) => {
    try{
        const hash = req.params.shareLink;
        const link = await LinkModel.findOne({
            hash: hash
        })
        if(!link) {
            res.status(401).json({
                message: "shareLink does not exist"
            })
            return;
        }

        //else we will get the user id from the existing link in db and use it to get all the user's content
        const content = await ContentModel.find({
            userId: link.userId
        })

        const user = await UserModel.findOne({
            _id: link.userId
        })

        if(!user) {
            res.status(411).json({
                message: "This error should ideally not happen"
            })
            return;
        }

        res.json({
            username: user.username,       //we do not use optional chaining if we are checking whether user exits or not
            content: content
        })
    }catch(e) {
        res.json({
            message: "Error opening link"
        })
    }
})

app.listen(3000);