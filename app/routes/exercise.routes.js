module.exports = app => {
    const dailyExercise = require("../controllers/exercise.controller.js");

    var router = require("express").Router();

    // Create a new daily exercise record
    router.post("/", dailyExercise.create);

    // Get daily exercise records by user
    router.get("/user/:user", dailyExercise.findByUser);

    app.use("/api/daily_exercise", router);
};
