import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const dbURI = `${process.env.MONGODB_URL}/${process.env.DB_NAME}`;
    if (!dbURI) throw new Error("Database URI is not defined in the environment variables");

    const connectionInstance = await mongoose.connect(dbURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected:", connectionInstance.connection.host);
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1); // Exit process with failure code
  }
};

export default connectDB;
