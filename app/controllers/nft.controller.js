const db = require("../models");
const NFT = db.nfts;

exports.create = (req, res) => {
    if(!req.body.address) {
        res.status(400).send({message: "Address can not be empty"});
        return;
    }

    const nft = new NFT({
        name: req.body.name,
        email:req.body.email,
        wallet_address: req.body.wallet_address,
        mint_fee: req.body.mint_fee,
        contract_address: req.body.contract_address,
        chain_id: req.body.chain_id,
        
    });

    nft
        .save(nft)
        .then(data => {
            res.send(data);
        })
        .catch(err =>{
            res.status(500).send({
                message:
                    err.message || "Some error occurred while creating the NFT."
            });
        });
};

exports.findOne = (req, res) => {
    const walletAddress = req.params.wallet;
    console.log(walletAddress)

    Profile.findOne({"wallet": walletAddress})
        .then(data => {
            if(!data)
                res.status(404).send({ message: "Not found your nft"});
            else res.send(data);
        })
        .catch(err => {
            res
                .status(500)
                .send({message: "Error retrieving your nft"});
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
            message: `Cannot update. Maybe your nft was not found!`
          });
        } else res.send({ message: "Your nft was updated successfully." });
      })
      .catch(err => {
        res.status(500).send({
          message: "An error occurred while updating your profile."
        });
      });
};

