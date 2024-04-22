const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  email: String,
  username: String,
  token: String,
  hash: String,
  salt: String,
  profilePictureUrl: String, // Stocker l'URL de l'image de profil
});

const User = mongoose.model("User", UserSchema);
module.exports = User;
