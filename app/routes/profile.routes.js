module.exports = app => {
    const profiles = require("../controllers/profile.controller.js");

    var router = require("express").Router();

    router.post("/", profiles.create);

    router.post("/:id", profiles.update);

    router.get("/:id", profiles.findOne);

    app.use("/api/profiles", router);
}