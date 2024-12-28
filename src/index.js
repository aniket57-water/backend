import mongoose from "mongoose";
// import {db_name} from "./constants.js";
import connectDB from "../db/index.js";
import express from "express";
import dotenv from "dotenv";
dotenv.config({
    path: './env'
})

const app = express();

connectDB()
.then(()=>{
    app.listen((process.env.PORT||8000), ()=>{
        console.log("Server is running on port : ", process.env.PORT)
    })  
})
.catch((err)=>{
    console.log("Connection failed ",err);
});
