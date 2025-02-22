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
        email:req.body.email
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