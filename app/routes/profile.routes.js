module.exports = app => {
    const profiles = require("../controllers/profile.controller.js");

    var router = require("express").Router();

    router.post("/", profiles.create);

    app.use("/api/profiles", router);
}