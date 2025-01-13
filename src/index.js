import mongoose from "mongoose";
// import {db_name} from "./constants.js";
import connectDB from "../db/index.js";
import express from "express";
import dotenv from "dotenv";
import app from "./app.js";
dotenv.config({
    path: './env'
})


connectDB()
.then(()=>{
    app.listen((process.env.PORT||8001), ()=>{
        console.log("Server is running on port : ", process.env.PORT||8001)
    })  
})
.catch((err)=>{
    console.log("Connection failed ",err);
});
