import mongoose, {model, Schema} from 'mongoose';
import dotenv from "dotenv";
dotenv.config();
const MONGODB_URL = process.env.MONGODB_URL as string;
mongoose.connect(MONGODB_URL)

const UserSchema = new Schema({
    username: {type: String, unique: true, required: true},
    password: {type: String, required: true}
})

const ContentSchema = new Schema({
    title: {type: String, required: true},
    link: {type: String},
    tags: [{type: mongoose.Types.ObjectId, ref: 'Tag'}],
    userId: {type: mongoose.Types.ObjectId, ref: 'User', required: true}
})

// const TagSchema = new Schema({

// })

export const UserModel = model('User', UserSchema);
export const ContentModel = model('Content', ContentSchema);