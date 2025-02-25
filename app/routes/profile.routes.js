module.exports = app => {
    const profiles = require("../controllers/profile.controller.js");

    var router = require("express").Router();

    router.post("/", profiles.create);

    router.post("/:wallet", profiles.update);

    router.get("/:wallet", profiles.findOne);

    app.use("/api/profiles", router);
}