const mongoose = require("mongoose");

const photoSchema = mongoose.Schema({
  userId: {
    type: mongoose.Types.ObjectId,
    ref: "User",
    required: true,
  },
  miniUserId: {
    type: mongoose.Types.ObjectId,
    ref: "MiniUser",
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Photo", photoSchema);
