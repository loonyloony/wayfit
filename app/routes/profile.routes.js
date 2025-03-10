module.exports = app => {
    const profiles = require("../controllers/profile.controller.js");

    var router = require("express").Router();

    router.post("/", profiles.create);

    router.post("/:wallet", profiles.update);

    router.get("/:email", profiles.findOne);
    
     // Update profile by email using PUT method
     router.put("/:email", profiles.updateByEmail);

    router.get("/", profiles.listUser);

    app.use("/api/profiles", router);
}