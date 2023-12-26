const { default: mongoose } = require("mongoose");

const subscriptionInfoObjectSchema = new mongoose.Schema(
  {
    subID: {
      type: String,
      default: "",
    },
    isSubscribed: {
      type: Boolean,
      default: false,
    },
    lastSubscribed: {
      type: Date,
      default: false,
    },
  },
  { timestamps: true }
);

const userSchema = new mongoose.Schema(
  {
    firstname: {
      type: String,
    },
    lastname: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
    },
    subscriptionInfo: subscriptionInfoObjectSchema,
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
module.exports = User;
