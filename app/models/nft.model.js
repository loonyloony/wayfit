module.exports = mongoose => {
    var schema = mongoose.Schema(
        {
            nft_id: { 
                type: String,
                required: true 
            },
            nft_image: {
                type: String,
            },
            chain_id: { 
                type: Number,
                min: 1,
                required: true
            },
            contract_address: {
                type: String,
                required: true
            },
            mint_fee: {
                type: Number,
                min: 0
            },
            wallet_address: {
                type: String
            },
            email: {
                type: String
            }
        }
    );

    schema.method("toJSON", function () {
        const { __v, _id, ...object } = this.toObject();
        object.id = _id;
        return object;
    });

    const NFT = mongoose.model("nft", schema);
    return NFT
}