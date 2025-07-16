import mongoose from "mongoose"
import jwt from "jsonwebtoken"

// var validateEmail = function (email) {
//   // var re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
//   var re = /^[A-Za-z0-9_!#$%&'*+\/=?`{|}~^.-]+@[A-Za-z0-9.-]+$/gm;
//   return re.test(email);
// };

const userSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    OTP: { type: String, expires: 1 },
  },
  { timestamps: true }
)

userSchema.methods.createJwt = function () {
  var payload = { uid: this._id, isAnon: this.isAnon }
  if (this.phone) payload["phone"] = this.phone
  return jwt.sign(payload, process.env.EXPAPP_JWT_SECRET, {
    // expiresIn: process.env.EXPAPP_JWT_LIFETIME,
  })
}

export default mongoose.model("Users", userSchema)
