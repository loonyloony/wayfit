// app/controllers/sui.controller.js
const db = require("../models");
const Sui = db.sui;

/**
 * Handle zkLogin authentication
 */
exports.handleZkLogin = async (req, res) => {
    try {
        // Validate request
        if (!req.body.idToken) {
            return res.status(400).send({ 
                success: false,
                message: "ID token cannot be empty" 
            });
        }
        
        const { idToken, accessToken, nonce, googleUserId } = req.body;
        
        // Extract email from Google user ID or use a placeholder
        const email = req.body.email || `google-${googleUserId}@example.com`;
        
        console.log("Processing zkLogin for email:", email);
        
        const data = await Sui.generateZkLoginData(idToken, accessToken, nonce, email);
        res.send(data);
    } catch (err) {
        console.error("zkLogin error:", err);
        res.status(500).send({
            success: false,
            error: err.message || "Some error occurred while processing zkLogin."
        });
    }
};

/**
 * Handle direct zkLogin initialization
 * This allows mobile apps to initialize zkLogin without Google Sign-In
 */
exports.initializeDirectZkLogin = async (req, res) => {
    try {
        // Check if the user is authenticated via token
        const userId = req.userId; // Assuming you have auth middleware that sets this
        let userEmail = null;
        
        // Find user profile if authenticated
        if (userId) {
            try {
                const Profile = db.profiles;
                const userProfile = await Profile.findOne({ id: userId });
                if (userProfile) {
                    userEmail = userProfile.email;
                }
            } catch (profileErr) {
                console.error("Error finding profile:", profileErr);
                // Continue with null email if profile lookup fails
            }
        }
        
        // If no authenticated user, check if email was provided in request
        if (!userEmail && req.body && req.body.email) {
            userEmail = req.body.email;
        }
        
        // If still no email, generate a random identifier
        if (!userEmail) {
            const randomId = require('crypto').randomBytes(8).toString('hex');
            userEmail = `anonymous-${randomId}@example.com`;
            console.log("Generated anonymous email:", userEmail);
        }
        
        console.log("Initializing direct zkLogin for:", userEmail);
        
        // Initialize zkLogin with the email
        const result = await Sui.initializeDirectZkLogin(userEmail);
        
        res.send(result);
    } catch (err) {
        console.error("Direct zkLogin initialization error:", err);
        res.status(500).send({
            success: false,
            error: err.message || "Failed to initialize direct zkLogin."
        });
    }
};

/**
 * Handle zkLogin refresh 
 */
exports.handleZkLoginRefresh = async (req, res) => {
    try {
        // Validate request
        if (!req.body.suiAddress) {
            return res.status(400).send({ 
                success: false,
                message: "SUI address cannot be empty" 
            });
        }
        
        const { idToken, suiAddress, nonce } = req.body;
        
        const data = await Sui.refreshZkLogin(idToken || 'refresh_token', suiAddress, nonce);
        res.send(data);
    } catch (err) {
        console.error("zkLogin refresh error:", err);
        res.status(500).send({
            success: false,
            error: err.message || "Some error occurred while refreshing zkLogin."
        });
    }
};

/**
 * Get zkLogin configuration
 */
exports.getZkLoginConfig = (req, res) => {
    try {
        const config = Sui.getZkLoginConfig();
        res.status(200).json(config);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to get zkLogin configuration'
        });
    }
};

/**
 * Initialize a new challenge
 */
exports.initializeChallenge = async (req, res) => {
    try {
        // Validate request
        if (!req.body.targetExercises || !req.body.durationDays) {
            return res.status(400).send({ 
                success: false,
                message: "Target exercises and duration days are required!" 
            });
        }
        
        const { targetExercises, durationDays } = req.body;
        
        const result = await Sui.initializeChallenge(
            parseInt(targetExercises), 
            parseInt(durationDays)
        );
        
        res.json(result);
    } catch (error) {
        console.error("Error initializing challenge:", error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to initialize challenge'
        });
    }
};

/**
 * Join an existing challenge
 */
exports.joinChallenge = async (req, res) => {
    try {
        // Validate request
        if (!req.body.poolId || !req.body.userAddress) {
            return res.status(400).send({ 
                success: false,
                message: "Pool ID and user address are required!" 
            });
        }
        
        const { poolId, userAddress } = req.body;
        
        const result = await Sui.joinChallenge(poolId, userAddress);
        res.json(result);
    } catch (error) {
        console.error("Error joining challenge:", error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to join challenge'
        });
    }
};

/**
 * Complete an exercise in a challenge
 */
exports.completeExercise = async (req, res) => {
    try {
        // Validate request
        if (!req.body.poolId || !req.body.nftId || !req.body.userAddress) {
            return res.status(400).send({ 
                success: false,
                message: "Pool ID, NFT ID, and user address are required!" 
            });
        }
        
        const { poolId, nftId, userAddress } = req.body;
        
        const result = await Sui.completeExercise(poolId, nftId, userAddress);
        res.json(result);
    } catch (error) {
        console.error("Error completing exercise:", error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to complete exercise'
        });
    }
};

/**
 * Create a new NFT
 */
exports.createNFT = async (req, res) => {
    try {
        // Validate request
        if (!req.body.name || !req.body.userAddress) {
            return res.status(400).send({ 
                success: false,
                message: "Name and user address are required!" 
            });
        }
        
        const { name, description, imageUrl, userAddress } = req.body;
        
        const result = await Sui.createNFT(name, description, imageUrl, userAddress);
        res.json(result);
    } catch (error) {
        console.error("Error creating NFT:", error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to create NFT'
        });
    }
};

/**
 * Get pool information
 */
exports.getPoolInfo = async (req, res) => {
    try {
        const id = req.params.id;
        
        const poolInfo = await Sui.getPoolInfo(id);
        res.json(poolInfo);
    } catch (error) {
        console.error("Error getting pool info:", error);
        res.status(500).json({
            success: false,
            error: error.message || 'Error retrieving pool information'
        });
    }
};

/**
 * Get user balance
 */
exports.getBalance = async (req, res) => {
    try {
        const { address } = req.params;
        
        const balance = await Sui.getBalance(address);
        res.json(balance);
    } catch (error) {
        console.error("Error getting balance:", error);
        res.status(500).json({
            success: false,
            error: error.message || 'Error retrieving balance'
        });
    }
};

/**
 * Check if a user is a winner in a challenge
 */
exports.checkWinner = async (req, res) => {
    try {
        const { poolId, address } = req.params;
        
        const result = await Sui.checkWinner(poolId, address);
        res.json(result);
    } catch (error) {
        console.error("Error checking winner status:", error);
        res.status(500).json({
            success: false,
            error: error.message || 'Error checking winner status'
        });
    }
};