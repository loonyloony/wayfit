require('dotenv').config();
module.exports = {
    // MongoDB connection
    url: process.env.DATABASE_URL || "mongodb+srv://wefit365:wefit365@cluster0.h63jd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
    
    // Sui RPC configuration
    suiRpcUrl: process.env.SUI_RPC_URL || 'https://fullnode.testnet.sui.io',
    
    // zkLogin configuration
    zkLogin: {
      jwtIssuer: process.env.JWT_ISSUER || 'https://accounts.google.com',
      maxEpoch: process.env.MAX_EPOCH || '5',
      networkEnv: process.env.NETWORK_ENV || 'testnet'
    }
  };