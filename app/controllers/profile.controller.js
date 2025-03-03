const db = require("../models");
const Profile = db.profiles;

exports.create = (req, res) => {
    if(!req.body.address) {
        res.status(400).send({message: "Address can not be empty"});
        return;
    }

    const profile = new Profile({
        name: req.body.name,
        address: req.body.address,
        email:req.body.email,
        wallet: req.body.wallet,
        
    });

    profile
        .save(profile)
        .then(data => {
            res.send(data);
        })
        .catch(err =>{
            res.status(500).send({
                message:
                    err.message || "Some error occurred while creating the Profile."
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