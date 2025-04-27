const dbConfig = require("../config/db.config.js");

const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

const db = {}
db.mongoose = mongoose;
db.url = dbConfig.url;
db.profiles = require("./profile.model.js")(mongoose);
db.daily_exercise = require("./exercise.model.js")(mongoose);

// Add SUI model reference
db.sui = require("./sui.model.js")(mongoose);

module.exports = db;