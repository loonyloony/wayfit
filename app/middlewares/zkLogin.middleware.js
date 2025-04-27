// zkLogin.middleware.js
const jwt = require("jsonwebtoken");
const config = require("../config/auth.config.js");
const db = require("../models");

// Verify Sui auth token and load zkProof data
const verifySuiToken = async (req, res, next) => {
  // Get the Sui token from headers
  const suiToken = req.headers["x-sui-token"];

  if (!suiToken) {
    return res.status(403).send({
      success: false,
      message: "No Sui token provided!"
    });
  }

  try {
    // Decode the token
    const tokenData = Buffer.from(suiToken, 'base64').toString();
    const { email, address } = JSON.parse(tokenData);

    // Set the data in the request object
    req.suiEmail = email;
    req.suiAddress = address;

    // Find the address in our database
    const SuiAddress = db.mongoose.model('SuiAddress');
    const addressMapping = await SuiAddress.findOne({ address });
    
    if (!addressMapping) {
      return res.status(401).send({
        success: false,
        message: "Invalid Sui token - address not found!"
      });
    }
    
    // Check if the email matches
    if (addressMapping.email !== email) {
      return res.status(401).send({
        success: false,
        message: "Invalid Sui token - email mismatch!"
      });
    }

    // Find the active zkLogin session for this address
    const ZkLogin = db.mongoose.model('ZkLogin');
    const zkLoginSession = await ZkLogin.findOne({ 
      address, 
      status: 'active',
      expiresAt: { $gt: new Date() }
    });
    
    if (!zkLoginSession) {
      return res.status(401).send({
        success: false,
        message: "No active zkLogin session found - please refresh your session"
      });
    }
    
    // Add zkProof data to the request
    req.suiAuth = {
      address,
      zkProof: zkLoginSession.zkProof
    };
    
    next();
  } catch (error) {
    console.error("Error verifying Sui token:", error);
    return res.status(401).send({
      success: false,
      message: "Invalid Sui token format!"
    });
  }
};

// Optional Sui token verification
const verifySuiTokenOptional = async (req, res, next) => {
  // Get the Sui token from headers
  const suiToken = req.headers["x-sui-token"];

  if (!suiToken) {
    // No token provided, but that's okay
    next();
    return;
  }

  try {
    // Decode the token
    const tokenData = Buffer.from(suiToken, 'base64').toString();
    const { email, address } = JSON.parse(tokenData);

    // Set the data in the request object
    req.suiEmail = email;
    req.suiAddress = address;

    // Try to find the address in our database
    const SuiAddress = db.mongoose.model('SuiAddress');
    const addressMapping = await SuiAddress.findOne({ address });
    
    if (addressMapping) {
      // Try to find an active zkLogin session
      const ZkLogin = db.mongoose.model('ZkLogin');
      const zkLoginSession = await ZkLogin.findOne({ 
        address, 
        status: 'active',
        expiresAt: { $gt: new Date() }
      });
      
      if (zkLoginSession) {
        // Add zkProof data to the request
        req.suiAuth = {
          address,
          zkProof: zkLoginSession.zkProof
        };
      }
    }
    
    next();
  } catch (error) {
    // Invalid token but we don't reject
    console.error("Error processing optional Sui token:", error);
    next();
  }
};

// Check if user is an admin
const isAdmin = async (req, res, next) => {
  try {
    // Get the email from the request
    const email = req.suiEmail;
    
    if (!email) {
      return res.status(403).send({
        success: false,
        message: "No user email found - authentication required"
      });
    }
    
    // Check if the user is an admin
    // This is a simplified example - you'd need to implement your own admin checking logic
    const adminEmails = ['admin@example.com', 'moderator@example.com'];
    
    if (adminEmails.includes(email)) {
      next();
    } else {
      return res.status(403).send({
        success: false,
        message: "Requires admin privileges"
      });
    }
  } catch (error) {
    console.error("Error checking admin status:", error);
    return res.status(500).send({
      success: false,
      message: "Error checking admin status"
    });
  }
};

// Export the middleware functions
module.exports = {
  verifySuiToken,
  verifySuiTokenOptional,
  isAdmin
};