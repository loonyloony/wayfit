module.exports = mongoose => {
    var schema = mongoose.Schema(
        {
            name: { 
                type: String,
                required: true 
            },
            email: { 
                type: String,
                unique: true,
                required: true
            },
            gender: {
                type: String,
                enum: ['Male', 'Female', 'Other']
            },
            age: {
                type: Number,
                min: 0
            },
            level: {
                type: Number,
                min: 0
            },
            weight: {
                type: Number,
                min: 0
            },
            height: {
                type: Number,
                min: 0
            },
            token_balance: {
                type: Number,
                min: 0
            },
            wallet: {
                type: String
            },
            exercise_completed: { 
                type: Number, 
                default: 0 
            }, // Added default value
            calories_burned: { 
                type: Number, 
                default: 0 
            }, // Added default value
            point: { 
                type: Number, 
                default: 0 
            }, // Added default value
            token: { 
                type: Number, 
                default: 0 
            }, // Added default value
        }
    );

    schema.method("toJSON", function () {
        const { __v, _id, ...object } = this.toObject();
        object.id = _id;
        return object;
    });

    const Profile = mongoose.model("profile", schema);
    return Profile
}