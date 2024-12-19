const mongoose = require("mongoose");

const keyResultSchema = new mongoose.Schema({
  title: { type: String, required: true },
  currentValue: { type: Number, required: true },
  targetValue: { type: Number, required: true },
  progress: { type: Number, default: 0 },
});

const okrSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, unique: true },
    description: { type: String },
    progress: { type: Number, default: 0 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    category: { type: String, enum: ["Individual", "Team"], required: true },
    department: { type: String, required: true },
    owners: [{ type: String, required: true }],
    createdBy: { type: String, required: true },
    status: {
      type: String,
      enum: ["Not Started", "In Progress", "Completed"],
      default: "Not Started",
    },
    keyResults: [keyResultSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("OKR", okrSchema);
