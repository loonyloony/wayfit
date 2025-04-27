// app/controllers/auth.controller.js
const db = require("../models");
const config = require("../config/auth.config");
const Profile = db.profiles;
const Sui = db.sui;

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

/**
 * Handle user registration
 */
exports.signup = (req, res) => {
  // Create a new user profile
  const profile = new Profile({
    name: req.body.name,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 8),
    // Optional fields
    gender: req.body.gender,
    age: req.body.age,
    level: req.body.level,
    weight: req.body.weight,
    height: req.body.height
  });

  profile.save()
    .then(user => {
      res.send({ 
        success: true,
        message: "User was registered successfully!" 
      });
    })
    .catch(err => {
      res.status(500).send({ 
        success: false, 
        message: err.message || "Some error occurred during registration."
      });
    });
};

/**
 * Handle user login
 */
exports.login = (req, res) => {
  Profile.findOne({
    email: req.body.email
  })
    .then(async user => {
      if (!user) {
        return res.status(404).send({ 
          success: false, 
          error: "User Not found." 
        });
      }

      const passwordIsValid = bcrypt.compareSync(
        req.body.password,
        user.password
      );

      if (!passwordIsValid) {
        return res.status(401).send({
          success: false,
          error: "Invalid Password!"
        });
      }

      // Generate JWT token
      const token = jwt.sign({ id: user.id }, config.secret, {
        expiresIn: config.jwtExpiration // 24 hours
      });

      // Create or get Sui address for this user
      let suiAddress = user.wallet;
      
      if (!suiAddress) {
        try {
          // Generate mock Sui address if none exists
          const zkLoginResult = await Sui.generateZkLoginData(
            `direct_${user.id}`, // Mock ID token
            null,
            null,
            user.email
          );
          
          suiAddress = zkLoginResult.address;
          
          // Save the wallet address to user profile
          user.wallet = suiAddress;
          await user.save();
          
        } catch (err) {
          console.error("Error generating Sui address:", err);
          // Continue with login even if Sui address generation fails
          suiAddress = null;
        }
      }

      res.status(200).send({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email
        },
        suiAddress: suiAddress,
        authToken: token
      });
    })
    .catch(err => {
      res.status(500).send({ 
        success: false, 
        error: err.message || "Error during login" 
      });
    });
};

/**
 * Handle user logout
 */
exports.logout = (req, res) => {
  // JWT is stateless, so we don't need to invalidate it server-side
  // The client should remove the token
  res.status(200).send({
    success: true,
    message: "User logged out successfully!"
  });
};