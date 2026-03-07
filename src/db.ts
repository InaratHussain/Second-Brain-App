import mongoose, {model, Schema} from 'mongoose';

mongoose.connect()

const UserSchema = new Schema({
    username: {type: String, unique: true, required: true},
    password: {type: String, required: true}
})

export const UserModel = model('User', UserSchema);
