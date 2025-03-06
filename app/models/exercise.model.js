module.exports = mongoose => {
    // Define the schema
    const schema = mongoose.Schema(
      {
        user: {
          type: String,
          required: true
        },
        // Storing `day` as a Date type
        day: {
          type: Date,
          required: true
        },
        type: {
          type: String,
          required: true
        },
        calories_burned: {
          type: Number,
          required: true,
          min: 0
        },
        duration: {
          type: Number,
          required: true,
          min: 0
        }
      },
      {
        timestamps: true // Optional: adds createdAt & updatedAt fields
      }
    );
  
    // Transform _id to id when converting to JSON
    schema.method("toJSON", function () {
      const { __v, _id, ...object } = this.toObject();
      object.id = _id;
      return object;
    });
  
    // Create and export the Mongoose model
    const DailyExercise = mongoose.model("daily_exercise", schema);
    return DailyExercise;
  };
  