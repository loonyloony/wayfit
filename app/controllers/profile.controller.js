const db = require("../models");
const Profile = db.profiles;

exports.create = (req, res) => {
    if(!req.body.email) {
        res.status(400).send({message: "Address can not be empty"});
        return;
    }

    const profile = new Profile({
        name: req.body.name,
        email: req.body.email,
        wallet: req.body.wallet,             // Optional: wallet address
        gender: req.body.gender,             // Optional: "Male", "Female", or "Other"
        age: req.body.age,                   // Optional: must be >= 0
        level: req.body.level,               // Optional: must be >= 0
        weight: req.body.weight,             // Optional: must be >= 0
        height: req.body.height,             // Optional: must be >= 0
        token_balance: req.body.token_balance, // Optional: must be >= 0
        exercise_completed: req.body.exercise_completed || 0, // Optional: default 0
        calories_burned: req.body.calories_burned || 0,     // Optional: default 0
        point: req.body.point || 0,                         // Optional: default 0
        token: req.body.token || 0,                         // Optional: default 0
    });

    profile
        .save()
        .then(data => {
            res.send(data);
        })
        .catch(err => {
            res.status(500).send({
                message: err.message || "Some error occurred while creating the Profile."
            });
        });
};

exports.findOne = (req, res) => {
    const email = req.params.email;
    console.log(email, " -params: ", req.params)

    Profile.findOne({"email": email})
        .then(data => {
            if(!data)
                res.status(404).send({ message: "Not found your profile"});
            else res.send(data);
        })
        .catch(err => {
            res
                .status(500)
                .send({message: "Error retrieving your profile"});
        });
}

exports.update = (req, res) => {
    if (!req.body) {
      return res.status(400).send({
        message: "Data to update can not be empty!"
      });
    }
  
    const wallet = req.params.wallet;
  
    Tutorial.findByWalletAndUpdate(wallet, req.body, { useFindAndModify: false })
      .then(data => {
        if (!data) {
          res.status(404).send({
            message: `Cannot update. Maybe your profile was not found!`
          });
        } else res.send({ message: "Your profile was updated successfully." });
      })
      .catch(err => {
        res.status(500).send({
          message: "An error occurred while updating your profile."
        });
      });
};

exports.listUser = (req, res) => {
  Profile.find({ })
      .then(data => {
          if (!data) {
              res.status(404).send({ message: `Profile not found` });
          } else {
              res.send(data);
          }
      })
      .catch(err => {
          res.status(500).send({ message: "Error retrieving profile: " + err });
      });
};

exports.updateByEmail = (req, res) => {
  if (!req.body) {
    return res.status(400).send({
      message: "Data to update cannot be empty!"
    });
  }

  const email = req.params.email;

  Profile.findOneAndUpdate(
    { email: email },
    req.body,
    { new: true, runValidators: true, useFindAndModify: false }
  )
    .then(data => {
      if (!data) {
        res.status(404).send({ message: `Profile not found with email: ${email}` });
      } else {
        res.send(data);
      }
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || `Error updating profile with email: ${email}`
      });
    });
};
