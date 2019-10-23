const { Schema, model } = require("mongoose");
const { isEmail } = require("validator");
const { hash, compare } = require("bcryptjs");
const { sign } = require("jsonwebtoken");

const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    toLowerCase: true,
    validate(email) {
      if (!isEmail(email)) {
        throw new Error("incorrect email");
      }
    }
  },
  password: {
    type: String,
    required: true,
    validate(password) {
      if (password.length < 6) {
        throw new Error("password must be at least 6 characters long");
      }
    }
  },
  tokens: [
    {
      token: {
        type: String,
        required: true
      }
    }
  ]
});

userSchema.methods.generateAuthToken = async function() {
  const token = sign({ _id: this._id }, "auth");
  this.tokens = [...this.tokens, { token }];
  await this.save();
  return token;
};

userSchema.statics.logIn = async (email, password) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new Error("cannot login");
  }
  const isMatch = await compare(password, user.password);
  if (!isMatch) {
    throw new Error("cannot login");
  }
  return user;
};

userSchema.pre("save", async function(next) {
  try {
    if (this.__v === undefined) {
      const passHash = await hash(this.password, 8);
      this.password = passHash;
    }
  } catch (err) {
    throw new Error("an error occured!");
  }
  next();
});

const User = model("user", userSchema);

module.exports = User;