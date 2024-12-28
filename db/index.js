import mongoose from 'mongoose';
import {db_name} from '../src/constants.js'

import express from 'express';

const app = express();
const connectDB = async()=>{
    try{
       const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${db_name
       }`);
       console.log("MongoDB connected ", `${connectionInstance.connection.host}`)
       app.on("error",()=>{
        console.log("Error", error)
        throw error;
       });

       app.listen(process.env.PORT, ()=>{
        console.log(
            `App is listening on port ${process.env.PORT}`
        )
       })

    }
    catch(error){
        console.log("Error", error);
        process.exit(1);
    }
}


export default connectDB;