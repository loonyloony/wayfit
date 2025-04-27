const { authJwt } = require("../middlewares");

module.exports = app => {
  const sui = require("../controllers/sui.controller.js");
  const router = require("express").Router();
  
  // Helper function to safely apply middleware
  const safeMiddleware = (middleware) => {
    return middleware ? [middleware] : [];
  };
  
  // zkLogin endpoints - REMOVE THE /sui PREFIX FROM ALL ROUTES
  router.post("/zklogin", sui.handleZkLogin);
  router.post("/zklogin/refresh", sui.handleZkLoginRefresh);
  router.get("/zklogin/config", sui.getZkLoginConfig);
  
  // Direct zkLogin endpoint
  router.post(
    "/zklogin/initialize-direct", 
    safeMiddleware(authJwt && authJwt.verifyTokenOptional),
    sui.initializeDirectZkLogin
  );
  
  // Challenge endpoints - REMOVE THE /contract PREFIX
  router.post("/challenge/init", sui.initializeChallenge);
  router.post("/challenge/join", sui.joinChallenge);
  router.post("/challenge/complete-exercise", sui.completeExercise);
  
  // NFT endpoints - REMOVE THE /contract PREFIX
  router.post("/nft/create", sui.createNFT);
  
  // Information retrieval - REMOVE THE /contract PREFIX
  router.get("/pool/:id", sui.getPoolInfo);
  router.get("/balance/:address", sui.getBalance);
  router.get("/winner/:poolId/:address", sui.checkWinner);
  
  // Register the router
  app.use("/api/sui", router);
};