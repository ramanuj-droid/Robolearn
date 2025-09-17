const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("MongoDB connected successfully");

    mongoose.connection.on("connected", () =>
      console.log("Mongoose connected")
    );
    mongoose.connection.on("error", (err) =>
      console.error("Mongoose connection error:", err)
    );
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }
};

module.exports = connectDB;
