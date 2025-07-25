import mongoose from "mongoose";

const counterSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true 
  },
  value: { 
    type: Number, 
    default: 0 
  }
}, { timestamps: true });

// Static method to get next sequence value
counterSchema.statics.getNextSequence = async function(sequenceName) {
  const counter = await this.findOneAndUpdate(
    { name: sequenceName },
    { $inc: { value: 1 } },
    { 
      new: true, 
      upsert: true,
      setDefaultsOnInsert: true 
    }
  );
  return counter.value;
};

// Static method to get current sequence value without incrementing
counterSchema.statics.getCurrentSequence = async function(sequenceName) {
  const counter = await this.findOne({ name: sequenceName });
  return counter ? counter.value : 0;
};

export default mongoose.model("Counter", counterSchema);
