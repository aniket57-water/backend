import {Router} from "express";
import { loginUser, logoutUser, refreshAccessToken, registerUser } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";


const Userrouter = Router()

Userrouter.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
);


Userrouter.route("/login").post(loginUser);

//secured routes
Userrouter.route("/logout").post(verifyJWT,logoutUser);
Userrouter.route("/refreshToken").post(refreshAccessToken);


export default Userrouter;