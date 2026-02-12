import mongoose from "mongoose";

/**
 * MongoDB Connection Configuration
 * Optimized for performance with connection pooling and other settings
 */
const mongooseOptions = {
  // Connection Pool Settings
  maxPoolSize: 10,           // Maximum number of sockets in the connection pool
  minPoolSize: 2,            // Minimum number of sockets in the connection pool
  
  // Timeout Settings
  serverSelectionTimeoutMS: 5000, // Time to try selecting a server before throwing
  socketTimeoutMS: 45000,         // How long a socket stays inactive before closing
  
  // Connection Settings
  family: 4,                 // Use IPv4, skip trying IPv6
  
  // Retry Settings
  retryWrites: true,         // Retry failed writes
  retryReads: true,          // Retry failed reads
};

const connectDB = async () => {
  try {
    const connection = await mongoose.connect(process.env.MONGODB_URI, mongooseOptions);
    
    // Log connection info
    console.log(`MongoDB Connected: ${connection.connection.host}`);
    
    // Set up connection event listeners for monitoring
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected. Attempting to reconnect...');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });
    
    // Graceful shutdown handling
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed due to app termination');
      process.exit(0);
    });
    
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1); // Exit process with failure
  }
};

export default connectDB;
