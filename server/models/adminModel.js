import mongoose from "mongoose"
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"

var validateEmail = function (email) {
  // var re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  var re = /^[A-Za-z0-9_!#$%&'*+\/=?`{|}~^.-]+@[A-Za-z0-9.-]+$/gm
  return re.test(email)
}

const adminSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      validate: [validateEmail, "Please fill a valid email address"],
    },
    location: { type: String },
    password: {
      type: String,
    },
  },
  { timestamps: true }
)

adminSchema.pre("save", async function () {
  if (this.password) {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
  }
})

adminSchema.methods.createJwt = function () {
  var payload = { uid: this._id }
  if (this.email) payload["email"] = this.email
  return jwt.sign(payload, process.env.EXPAPP_JWT_SECRET, {
    // expiresIn: process.env.EXPAPP_JWT_LIFETIME,
  })
}

adminSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

export default mongoose.model("Admins", adminSchema)
