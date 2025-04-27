// app/routes/auth.routes.js
module.exports = app => {
    const controller = require("../controllers/auth.controller");
  
    var router = require("express").Router();
  
    // Register a new user
    router.post("/signup", controller.signup);
  
    // User login
    router.post("/login", controller.login);
    
    // User logout
    router.post("/logout", controller.logout);
  
    app.use("/auth", router);
  };