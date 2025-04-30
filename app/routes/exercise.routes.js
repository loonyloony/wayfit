module.exports = app => {
    const dailyExercise = require("../controllers/exercise.controller.js");

    var router = require("express").Router();

    // Create a new daily exercise record
    router.post("/", dailyExercise.create);
    router.get("/", dailyExercise.findAll);

    // Get daily exercise records by user
    router.get("/user/:user", dailyExercise.findByUser);
    router.get("/performanceByType", dailyExercise.getPerformanceByType);

    app.use("/api/daily_exercise", router);
};
