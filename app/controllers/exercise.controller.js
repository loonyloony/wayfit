const db = require("../models");
const DailyExercise = db.daily_exercise; // Assumes daily_exercise model is exported from models/index.js

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
