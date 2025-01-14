import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/apierror.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {upload} from "../middlewares/multer.middleware.js";
import {ApiResponse} from "../utils/apiresponse.js";
import jwt from "jsonwebtoken";

// const registerUser = asyncHandler(async(req,res)=>{
//     // get user details from frontend
//     // validation - not empty
//     // check if user already exists : username, email
//     // check for images , check for avatar
//     // upload them to cloudinary, avatar
//     // create userobject - create entry in db
//     // remove passowrd and referesh token field from response
//     // check for user creation
//     // return res

//     const {fullname, email, username, password}= req.body;
//     console.log("email ", email);

//     if(
//         [fullname,email,username,password].some((field)=>
//             field?.trim() === "")
//     ){
//         throw new ApiError(400,"All fields are necessary and required");
//     }

//     const existedUser = await User.findOne({
//         $or: [ { username} , { email } ]
//     })

//     if(existedUser){
//         throw new ApiError(400,"User with email or username already exists");
//     }

//     const avatarLocalPath = req.files?.avatar[0]?.path;
//     const coverImageLocalPath = req.files?.coverImage[0]?.path

//     if(!avatarLocalPath){
//         throw new ApiError(400,"Avatar file is required");
//     }

//     const avatar = await uploadOnCloudinary(avatarLocalPath);
//     const coverImage= await uploadOnCloudinary(coverImageLocalPath);

//     if(!avatar){
//         throw new ApiError(400,"Avatar file is required");
//     }

//     const user = await User.create({
//         fullname,
//         avatar: avatar.url?.url||"",
//         coverImage: coverImage.url?.url||"",
//         email,
//         password,
//         username: username.toLowerCase(),
//     })

//     const createdUser = await User.findById(user._id).select(
//         "-password -refreshToken"
//     )

//     if(!createdUser){
//         throw new ApiError(500,"Something went wrong while registering the user");

//     }

//     return res.status(201).json(
//         new ApiResponse(200,createdUser,"User registered sucessfully")
//     )

// })

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({validateBeforeSave: false});

    return {accessToken, refreshToken};



  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token",
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // console.log("req.body:", req.body); // Logs text fields
  // console.log("req.files:", req.files); // Logs uploaded files

  const {fullname, email, username, password} = req.body;

  if (
    [fullname, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are necessary and required");
  }

  const existedUser = await User.findOne({
    $or: [{username}, {email}],
  });

  if (existedUser) {
    throw new ApiError(400, "User with email or username already exists");
  }

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  let coverImageLocalPath;

  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  console.log("Avatar path:", avatarLocalPath);
  console.log("CoverImage path:", coverImageLocalPath);

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = coverImageLocalPath
    ? await uploadOnCloudinary(coverImageLocalPath)
    : null;

  if (!avatar) {
    throw new ApiError(400, "Avatar file upload failed");
  }

  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // req body ->data
  // username or email
  // find the user
  // password check
  // access and refresh token
  // send cookie

  const {email, username, password} = req.body;

  if (!email && !username) {
    throw new ApiError(400, "Username or email is required");
  }

  const existingUser = await User.findOne({
    $or: [{username}, {email}],
  });

  if (!existingUser) {
    throw new ApiError(400, "User doesnt exists");
  }

  const isPasswordValid = await existingUser.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Password not correct");
  }

    const {accessToken, refreshToken}=await generateAccessAndRefreshToken(existingUser._id);

    const loggedInUser = await User.findById(existingUser._id).select(
       "-password -refreshToken" 
    );

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged in sucessfully"
        )
    );
});


const logoutUser = asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
      req.user._id,
      {
        $set:{
          refreshToken: undefined
        }
      }, 
      {
        new : true
      }
    )

    const options={
      httpOnly: true,
      secure: true
    }


    return res.status(200).clearCookie("accessToken",options).clearCookie("refreshToken",options)
    .json(new ApiResponse(200, {}, "User loggout sucessfully"));
})


const refreshAccessToken = asyncHandler(async(req,res)=>{
 try {
   const incomingRefreshToken=  req.cookies.refreshToken || req.body.refreshToken
 
   if(!incomingRefreshToken){
     throw new ApiError(401,"Unauthorized request")
   }
 
   const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
 
   const user = User.findById(decodedToken?._id)
 
   if(!user){
     throw new ApiError(401,"Invalid refresh Token")
   }
 
   if(incomingRefreshToken!== user?.refreshToken){
     throw new ApiError(401,"Refresh Token is expired")
   }
 
   const options={
     httpOnly: true,
     secure: true
   }
 
   const {accessToken, refreshToken}=await generateAccessAndRefreshToken(user._id);
 
   return res.status(200).cookie("accessToken",accessToken).cookie("refreshToken",refreshToken).json(
     new ApiResponse(200,{refreshToken: refreshToken},"New refresh Token ")
   );
 
 } catch (error) {
    throw new ApiError(401, error?.message||"Invalid refresh Token");
 } 
})


const changeCurrentPassword = asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword}=req.body;

    const user = await User.findById(req.user?._id)

    const isPasswordCorrect1 = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect1){
      throw new ApiError(401,"Invalid password");
    }


    user.password = newPassword;

    await user.save({validateBeforeSave: false});

    return res.status(200)
    .json(new ApiResponse(200,{},"Password changed successfully"));
})

const getCurrentUser = asyncHandler((req,res)=>{
  return res
  .status(200)
  .json(200,req.user, "Current user fetched successfully");
})



const updateAccountDetails = asyncHandler(async(req,res)=>{
    const {fullname,email}=req.body;

    if (!fullname|| !email) {
        throw new ApiError(400,"All fields are required");
    }

   const user =  User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
              fullname,
              email
            }
        },
        {new : true},
    ).select("-password")

    return res.status(200).json(new ApiResponse(200,user,"Account details updated sucessfully"));

});

const updateUserAvatar = asyncHandler(async(req,res)=>{
    
  const avatarLocalPath = req.file?.path;
  if(!avatarLocalPath){
    throw new ApiError(400,"Avatar file is missing")
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if(!avatar.url){
    throw new ApiError(401,"Error while uploading avatar")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id, 
    {
      $set: {
        avatar: avatar.url
      }
    },
    {
      new: true
    }
  ).select("-password")

  return res.status(200).json(new ApiResponse(200,user,"Cover Image updated successfully"));

});

const updateUserCoverImage = asyncHandler(async(req,res)=>{
    
  const coverImageLocalPath = req.file?.path;
  if(!coverImageLocalPath){
    throw new ApiError(400,"Avatar file is missing")
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if(!coverImage.url){
    throw new ApiError(401,"Error while uploading coverImage")
  }

  await User.findByIdAndUpdate(
    req.user?._id, 
    {
      $set: {
        coverImage: coverImage.url
      }
    },
    {
      new: true
    }
  ).select("-password")

});

export {registerUser, loginUser, logoutUser, generateAccessAndRefreshToken, refreshAccessToken,updateAccountDetails,updateUserAvatar,updateUserCoverImage};
  