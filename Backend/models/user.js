const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { Schema } = mongoose;

const addressSchema = require("./sharedSchemas.js");


const cartSchema = new Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, "Quantity cannot be less than 1"],
      default: 1,
    },
    price: {  
      type: Number,
      required: true
    },
    addedAt: {  
      type: Date,
      default: Date.now
    }
  },
  { _id: true } 
);

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      select: false, 
    },

    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },

    role: {
      type: String,
      enum: ["buyer", "seller", "both"],
      required: [true, "Role is required"],
    },

    mobNo: {
      type: String,
      trim: true,
    },

    sellerInfo: {
      shopName: { type: String, trim: true },
      shopAddress: addressSchema,
    },

    buyerInfo: {
      shippingAddresses: [addressSchema],
      cart: [cartSchema],
    },
  },
  { timestamps: true }
);


userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password.trim(), salt);
    next();
  } catch (error) {
    next(error);
  }
});


userSchema.methods.comparePassword = async function (enteredPassword) {
  if (!this.password) return false; 
  return await bcrypt.compare(enteredPassword.trim(), this.password);
};

module.exports = mongoose.model("User", userSchema);
