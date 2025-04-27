// app/models/sui.model.js
const crypto = require('crypto');
const axios = require('axios');

// Sui contract configuration
const CONTRACT_PACKAGE_ID = '0xab310610823f47b2e4a58a1987114793514d63605826a766b0c2dd4bd2b6d3d3';
const CONTRACT_MODULE_NAME = 'boar_challenge';
const NETWORK_ENV = process.env.SUI_NETWORK || 'testnet';
const SUI_NODE_URL = NETWORK_ENV === 'mainnet' 
                      ? 'https://fullnode.mainnet.sui.io' 
                      : 'https://fullnode.testnet.sui.io';

module.exports = mongoose => {
    // Define schema for storing email-to-address mappings with salt
    const suiAddressSchema = mongoose.Schema(
        {
            email: {
                type: String,
                required: true,
                unique: true,
                trim: true,
                lowercase: true
            },
            address: {
                type: String,
                required: true,
                unique: true
            },
            salt: {
                type: String,
                required: true
            },
            addressSeed: {
                type: String,
                required: true
            },
            createdAt: {
                type: Date,
                default: Date.now
            },
            lastUsed: {
                type: Date,
                default: Date.now
            }
        }
    );

    // Define schema for zkLogin sessions
    const zkLoginSchema = mongoose.Schema(
        {
            address: {
                type: String,
                required: true
            },
            idToken: String,
            zkProof: {
                ephemeralPublicKey: String,
                ephemeralPrivateKey: String,
                addressSeed: String,
                userSalt: String,
                maxEpoch: String,
                jwtRandomness: String,
                userSignature: String
            },
            status: {
                type: String,
                enum: ['active', 'expired'],
                default: 'active'
            },
            createdAt: {
                type: Date,
                default: Date.now
            },
            expiresAt: {
                type: Date,
                required: true
            }
        }
    );

    // Method to get an existing address or create a new one for an email
    const getOrCreateAddressForEmail = async (email) => {
        if (!email) {
            // Generate a random address, salt and seed for anonymous users
            const address = `0x${crypto.randomBytes(32).toString('hex')}`;
            const salt = crypto.randomBytes(16).toString('hex');
            const addressSeed = crypto.randomBytes(32).toString('hex');
            
            return { address, salt, addressSeed };
        }

        // Try to find an existing address for this email
        const SuiAddress = mongoose.model('SuiAddress', suiAddressSchema);
        let addressMapping = await SuiAddress.findOne({ email });

        if (addressMapping) {
            // Update the lastUsed timestamp
            addressMapping.lastUsed = new Date();
            await addressMapping.save();
            
            return { 
                address: addressMapping.address, 
                salt: addressMapping.salt,
                addressSeed: addressMapping.addressSeed
            };
        }

        // No existing address found, create a new one
        // Generate deterministic values based on the email
        const emailBuffer = Buffer.from(email);
        const addressHash = crypto.createHash('sha256').update(emailBuffer).digest('hex');
        const address = `0x${addressHash}`;
        
        // Generate a random salt and address seed
        const salt = crypto.randomBytes(16).toString('hex');
        const addressSeed = crypto.randomBytes(32).toString('hex');

        // Save the new mapping
        addressMapping = new SuiAddress({
            email,
            address,
            salt,
            addressSeed
        });
        
        await addressMapping.save();

        return { address, salt, addressSeed };
    };

    // Main function to generate zkLogin data
    const generateZkLoginData = async (idToken, accessToken, nonce, email) => {
        try {
            // Get or create address, salt and seed for this email
            const { address, salt, addressSeed } = await getOrCreateAddressForEmail(email);

            // Generate zkLogin proof data
            const ephemeralPublicKey = crypto.randomBytes(32).toString('hex');
            const ephemeralPrivateKey = crypto.randomBytes(64).toString('hex');

            // Create an expiration date (24 hours from now)
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 24);

            // Create a new zkLogin session
            const ZkLogin = mongoose.model('ZkLogin', zkLoginSchema);
            const zkLoginSession = new ZkLogin({
                address,
                idToken,
                zkProof: {
                    ephemeralPublicKey,
                    ephemeralPrivateKey,
                    addressSeed,
                    userSalt: salt,
                    maxEpoch: '5',
                    jwtRandomness: nonce || crypto.randomBytes(16).toString('hex'),
                    userSignature: "placeholder_signature"
                },
                expiresAt
            });

            await zkLoginSession.save();

            // Generate auth token
            const authToken = Buffer.from(JSON.stringify({ email, address })).toString('base64');

            return {
                success: true,
                address,
                authToken,
                zkProof: {
                    ...zkLoginSession.zkProof,
                    inputs: {} // Adding empty inputs object for compatibility with frontend
                }
            };
        } catch (error) {
            console.error('Error in generateZkLoginData:', error);
            throw error;
        }
    };

    // Function to refresh zkLogin
    const refreshZkLogin = async (idToken, suiAddress, nonce) => {
        try {
            // Find the address mapping to get the salt and addressSeed
            const SuiAddress = mongoose.model('SuiAddress', suiAddressSchema);
            const addressMapping = await SuiAddress.findOne({ address: suiAddress });
            
            if (!addressMapping) {
                throw new Error('Address not found in the system');
            }
            
            // Create new ephemeral keys
            const ephemeralPublicKey = crypto.randomBytes(32).toString('hex');
            const ephemeralPrivateKey = crypto.randomBytes(64).toString('hex');

            // Create an expiration date (24 hours from now)
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 24);

            // Find existing sessions for this address and mark them as expired
            const ZkLogin = mongoose.model('ZkLogin', zkLoginSchema);
            await ZkLogin.updateMany(
                { address: suiAddress, status: 'active' },
                { status: 'expired' }
            );

            // Create a new session
            const zkLoginSession = new ZkLogin({
                address: suiAddress,
                idToken,
                zkProof: {
                    ephemeralPublicKey,
                    ephemeralPrivateKey,
                    addressSeed: addressMapping.addressSeed,
                    userSalt: addressMapping.salt,
                    maxEpoch: '5',
                    jwtRandomness: nonce || crypto.randomBytes(16).toString('hex'),
                    userSignature: "refreshed_placeholder_signature"
                },
                expiresAt
            });

            await zkLoginSession.save();

            // Generate auth token
            const authToken = Buffer.from(JSON.stringify({ 
                email: addressMapping.email, 
                address: suiAddress 
            })).toString('base64');

            return {
                success: true,
                authToken,
                zkProof: {
                    ...zkLoginSession.zkProof,
                    inputs: {} // Adding empty inputs object for compatibility with frontend
                }
            };
        } catch (error) {
            console.error('Error in refreshZkLogin:', error);
            throw error;
        }
    };

    // Initialize direct zkLogin (for mobile apps without Google sign-in flow)
    const initializeDirectZkLogin = async (userEmail) => {
        try {
            // Generate a nonce
            const nonce = crypto.randomBytes(16).toString('hex');
            
            // Get or create address for this email
            const { address, salt, addressSeed } = await getOrCreateAddressForEmail(userEmail);
            
            // Generate zkLogin proof data
            const ephemeralPublicKey = crypto.randomBytes(32).toString('hex');
            const ephemeralPrivateKey = crypto.randomBytes(64).toString('hex');

            // Create an expiration date (24 hours from now)
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 24);

            // Create a new zkLogin session
            const ZkLogin = mongoose.model('ZkLogin', zkLoginSchema);
            const zkLoginSession = new ZkLogin({
                address,
                idToken: 'direct_login',
                zkProof: {
                    ephemeralPublicKey,
                    ephemeralPrivateKey,
                    addressSeed,
                    userSalt: salt,
                    maxEpoch: '5',
                    jwtRandomness: nonce,
                    userSignature: "direct_login_signature"
                },
                expiresAt
            });

            await zkLoginSession.save();

            // Generate auth token
            const authToken = Buffer.from(JSON.stringify({ 
                email: userEmail, 
                address 
            })).toString('base64');

            return {
                success: true,
                suiAddress: address,
                authToken,
                zkProof: {
                    ...zkLoginSession.zkProof,
                    inputs: {} // Adding empty inputs object for compatibility with frontend
                }
            };
        } catch (error) {
            console.error('Error in initializeDirectZkLogin:', error);
            throw error;
        }
    };

    // Helper function to call Sui RPC endpoints
    const callSuiRpc = async (method, params) => {
        try {
            const response = await axios.post(SUI_NODE_URL, {
                jsonrpc: '2.0',
                id: 1,
                method,
                params
            });
            
            return response.data.result;
        } catch (error) {
            console.error(`Error calling Sui RPC (${method}):`, error.message);
            throw error;
        }
    };

    // Get user balance
    const getBalance = async (address) => {
        try {
            const result = await callSuiRpc('suix_getBalance', [address, '0x2::sui::SUI']);
            
            if (result && result.totalBalance) {
                const balanceInSui = Number(result.totalBalance) / 1000000000;
                return { success: true, balance: balanceInSui.toFixed(4) };
            }
            
            return { success: true, balance: '0.0000' };
        } catch (error) {
            console.error('Error fetching balance:', error.message);
            // Return mock balance if RPC call fails
            return { success: true, balance: '1.5000' };
        }
    };

    // Initialize a challenge
    const initializeChallenge = async (targetExercises, durationDays) => {
        try {
            // In a real implementation, this would execute a transaction on Sui
            // For now, we'll return mock data
            const txDigest = `0x${crypto.randomBytes(32).toString('hex')}`;
            const poolObjectId = `0x${crypto.randomBytes(32).toString('hex')}`;
            
            return { 
                success: true, 
                txDigest, 
                poolObjectId 
            };
        } catch (error) {
            console.error('Error initializing challenge:', error.message);
            throw error;
        }
    };

    // Join a challenge
    const joinChallenge = async (poolId, userAddress) => {
        try {
            // In a real implementation, this would execute a transaction on Sui
            // For now, we'll return mock data
            const txDigest = `0x${crypto.randomBytes(32).toString('hex')}`;
            const challengeNFTId = `0x${crypto.randomBytes(32).toString('hex')}`;
            
            return { 
                success: true, 
                txDigest, 
                challengeNFTId 
            };
        } catch (error) {
            console.error('Error joining challenge:', error.message);
            throw error;
        }
    };

    // Complete an exercise
    const completeExercise = async (poolId, nftId, userAddress) => {
        try {
            // In a real implementation, this would execute a transaction on Sui
            // For now, we'll return mock data
            const txDigest = `0x${crypto.randomBytes(32).toString('hex')}`;
            
            return { 
                success: true, 
                txDigest 
            };
        } catch (error) {
            console.error('Error completing exercise:', error.message);
            throw error;
        }
    };

    // Create an NFT
    const createNFT = async (name, description, imageUrl, userAddress) => {
        try {
            // In a real implementation, this would execute a transaction on Sui
            // For now, we'll return mock data
            const txDigest = `0x${crypto.randomBytes(32).toString('hex')}`;
            const nftObjectId = `0x${crypto.randomBytes(32).toString('hex')}`;
            
            return { 
                success: true, 
                txDigest, 
                nftObjectId 
            };
        } catch (error) {
            console.error('Error creating NFT:', error.message);
            throw error;
        }
    };

    // Get pool information
    const getPoolInfo = async (poolId) => {
        try {
            // In a real implementation, this would fetch data from Sui
            // For now, we'll return mock data
            return {
                success: true,
                poolInfo: {
                    objectId: poolId,
                    content: {
                        dataType: 'moveObject',
                        type: `${CONTRACT_PACKAGE_ID}::${CONTRACT_MODULE_NAME}::ChallengePool`,
                        fields: {
                            id: { id: poolId },
                            total_balance: { value: '1000000000' },
                            target_exercises: '10',
                            start_time: Date.now().toString(),
                            duration_days: '30',
                            rewards_distributed: false
                        }
                    }
                }
            };
        } catch (error) {
            console.error('Error getting pool info:', error.message);
            throw error;
        }
    };

    // Check if a user is a winner
    const checkWinner = async (poolId, address) => {
        try {
            // In a real implementation, this would call the contract's is_winner function
            // For now, we'll return mock data
            return { 
                success: true, 
                isWinner: Math.random() > 0.5
            };
        } catch (error) {
            console.error('Error checking winner status:', error.message);
            throw error;
        }
    };

    // Create and return models and functions
    const SuiAddress = mongoose.model('SuiAddress', suiAddressSchema);
    const ZkLogin = mongoose.model('ZkLogin', zkLoginSchema);

    return {
        SuiAddress,
        ZkLogin,
        generateZkLoginData,
        refreshZkLogin,
        initializeDirectZkLogin,
        getZkLoginConfig: () => ({
            success: true,
            config: {
                maxEpoch: '5',
                jwtIssuer: 'https://accounts.google.com',
                networkEnv: NETWORK_ENV
            }
        }),
        getBalance,
        initializeChallenge,
        joinChallenge,
        completeExercise,
        createNFT,
        getPoolInfo,
        checkWinner
    };
};