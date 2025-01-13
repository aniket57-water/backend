import mongoose from "mongoose"
import {Schema} from "mongoose";


const subscriptionSchema = new mongoose.Schema({
    subscriber: {
        type: Schema.Types.ObjectId, // one who is subscribing
        ref: "User"
    },
    Channel: {
        type: Schema.Types.ObjectId, // one to which 
        ref: "User"
    }
}, {timestamps: true})

export const Subscription = mongoose.model("Subscription",subscriptionSchema);

