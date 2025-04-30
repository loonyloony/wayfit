const db = require("../models");
const DailyExercise = db.daily_exercise; // Assumes daily_exercise model is exported from models/index.js

exports.findAll = (req, res) => {
  DailyExercise.find({})
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving daily exercise records."
      });
    });
};

// Create a new daily exercise record
exports.create = (req, res) => {
  // Validate required fields: 'user' and 'day'
  if (!req.body.user || !req.body.day) {
    return res.status(400).send({ message: "User and day are required." });
  }

  const dailyExercise = new DailyExercise({
    user: req.body.user,
    // Ensure the day is stored as a Date
    day: new Date(req.body.day),
    type: req.body.type,              // e.g., "running", "cycling"
    calories_burned: req.body.calories_burned,  // e.g., 250
    duration: req.body.duration       // e.g., duration in minutes or seconds
  });

  dailyExercise
    .save()
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Some error occurred while creating the daily exercise record."
      });
    });
};

// Retrieve all daily exercise records for a given user
exports.findByUser = (req, res) => {
  const user = req.params.user; // The user's identifier is passed as a route parameter

  DailyExercise.find({ user: user })
    .then(data => {
      if (!data || data.length === 0) {
        res.status(404).send({ message: "No daily exercise records found for this user." });
      } else {
        res.send(data);
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error retrieving daily exercise records: " + err.message
      });
    });
};

exports.getPerformanceByType = (req, res) => {
  const type = req.query.type;
  const start = req.query.start;
  const end = req.query.end;

  // Validate the required query parameters
  if (!type || !start || !end) {
    return res.status(400).send({ message: "Exercise type, start, and end dates are required." });
  }

  const startDate = new Date(start);
  const endDate = new Date(end);

  DailyExercise.aggregate([
    {
      $match: {
        type: type,
        day: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: "$user", // Group by user
        totalExercises: { $sum: 1 },
        totalDuration: { $sum: "$duration" },
        totalCalories: { $sum: "$calories_burned" },
        // Collect distinct exercise days for each user
        distinctDays: { $addToSet: { $dateToString: { format: "%Y-%m-%d", date: "$day" } } }
      }
    },
    {
      $project: {
        _id: 0,
        user: "$_id",
        totalExercises: 1,
        totalDuration: 1,
        totalCalories: 1,
        exerciseDays: { $size: "$distinctDays" }
      }
    }
  ])
    .then(result => {
      if (!result || result.length === 0) {
        res.status(404).send({ message: "No exercise records found for the given type and time range." });
      } else {
        res.send(result);
      }
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Error retrieving performance data."
      });
    });
};

