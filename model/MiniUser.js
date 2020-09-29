const mongoose = require("mongoose");

const miniUserSchema = mongoose.Schema({
  userId: {
    type: mongoose.Types.ObjectId,
    required: true,
  },
  displayName: {
    type: String,
    required: true,
  },
  profilePicture: {
    type: String,
    default: "",
  },
});

module.exports = mongoose.model("MiniUsers", miniUserSchema);