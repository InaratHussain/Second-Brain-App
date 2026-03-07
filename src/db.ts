import mongoose, {model, Schema} from 'mongoose';
import dotenv from "dotenv";
dotenv.config();
const MONGODB_URL = process.env.MONGODB_URL as string;
mongoose.connect(MONGODB_URL)

const UserSchema = new Schema({
    username: {type: String, unique: true, required: true},
    password: {type: String, required: true}
})

export const UserModel = model('User', UserSchema);
