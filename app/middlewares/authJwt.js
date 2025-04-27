// app/middlewares/authJwt.js
const jwt = require("jsonwebtoken");
const config = require("../config/auth.config.js");
const db = require("../models");
const Profile = db.profiles;

/**
 * Verify the JWT token in the Authorization header
 */
verifyToken = (req, res, next) => {
  let token = req.headers["x-access-token"] || req.headers["authorization"];

  if (!token) {
    return res.status(403).send({
      message: "No token provided!"
    });
  }

  // Remove Bearer prefix if present
  if (token.startsWith("Bearer ")) {
    token = token.slice(7, token.length);
  }

  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) {
      return res.status(401).send({
        message: "Unauthorized!"
      });
    }
    req.userId = decoded.id;
    next();
  });
};

/**
 * Optional token verification - doesn't reject if no token
 * or invalid token, but sets userId if token is valid
 */
verifyTokenOptional = (req, res, next) => {
  let token = req.headers["x-access-token"] || req.headers["authorization"];

  // If no token, just continue
  if (!token) {
    return next();
  }

  // Remove Bearer prefix if present
  if (token.startsWith("Bearer ")) {
    token = token.slice(7, token.length);
  }

  jwt.verify(token, config.secret, (err, decoded) => {
    if (!err) {
      req.userId = decoded.id;
    }
    // Continue regardless of token validity
    next();
  });
};

const authJwt = {
  verifyToken,
  verifyTokenOptional
};

module.exports = authJwt;