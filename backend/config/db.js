const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const options = {};
    if (process.env.MONGO_USER && process.env.MONGO_PASSWORD) {
      options.user = process.env.MONGO_USER;
      options.pass = process.env.MONGO_PASSWORD;
      options.authSource = "admin";
    }

    const conn = await mongoose.connect(process.env.MONGO_URI, options);

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Seed default demo user and data
    try {
      const seedDemoData = require("../src/utils/seeder");
      seedDemoData();
    } catch (seedError) {
      console.error(`🌱 Seeding warning: ${seedError.message}`);
    }
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;