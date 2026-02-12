/**
 * Environment variable validation utility
 */

const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET', 
  'FRONT_END_URL',
  'PORT'
];

export const validateEnvironment = () => {
  const missing = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  console.log('✅ Environment validation passed');
};

/**
 * Optional: Validate environment variable formats
 */
export const validateEnvFormats = () => {
  // Validate MongoDB URI format
  if (process.env.MONGODB_URI && !process.env.MONGODB_URI.startsWith('mongodb')) {
    console.warn('⚠️ MONGODB_URI should start with "mongodb://" or "mongodb+srv://"');
  }
  
  // Validate JWT_SECRET length
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.warn('⚠️ JWT_SECRET should be at least 32 characters long for security');
  }
  
  // Validate PORT is a number
  if (process.env.PORT && isNaN(parseInt(process.env.PORT))) {
    console.warn('⚠️ PORT should be a valid number');
  }
  
  // Validate FRONT_END_URL format
  if (process.env.FRONT_END_URL && !process.env.FRONT_END_URL.startsWith('http')) {
    console.warn('⚠️ FRONT_END_URL should start with "http://" or "https://"');
  }
};