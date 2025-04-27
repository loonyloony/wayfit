module.exports = app => {
    const nft = require("../controllers/nft.controller.js");

    var router = require("express").Router();

    router.post("/mint", nft.create);

    router.post("/:email", nft.update);

    router.get("/:email", nft.findOne);

    app.use("/v1/nft", router);
}