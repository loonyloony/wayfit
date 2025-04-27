// app/config/auth.config.js
module.exports = {
    secret: process.env.JWT_SECRET || "wayfit-secret-key",
    // You should set a proper environment variable in production
    jwtExpiration: 86400, // 24 hours in seconds
    
    // zkLogin specific configurations
    zkLogin: {
      maxEpoch: process.env.ZKLOGIN_MAX_EPOCH || '5',
      jwtIssuer: process.env.ZKLOGIN_JWT_ISSUER || 'https://accounts.google.com',
      networkEnv: process.env.ZKLOGIN_NETWORK_ENV || 'testnet'
    }
  };