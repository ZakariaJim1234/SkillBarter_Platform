const mongoose = require('mongoose');

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return; // reuse warm connection
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 8000 });
  console.log('MongoDB Connected');
};

module.exports = connectDB;
