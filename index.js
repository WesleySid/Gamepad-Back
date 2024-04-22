const express = require("express");
const cors = require("cors");
const app = express();
const cloudinary = require("cloudinary").v2;
const fileUpload = require("express-fileupload");
const mongoose = require("mongoose");
require("dotenv").config();

mongoose
  .connect("mongodb://localhost:27017/Gamepad")
  .then(() => {
    console.log("Connexion à MongoDB établie avec succès !");
  })
  .catch((err) => {
    console.error("Erreur lors de la connexion à MongoDB :", err);
  });

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

app.use(express.json());
app.use(cors());

const userRoutes = require("./routes/User");
app.use(userRoutes);

app.all("*", (req, res) => {
  return res.status(404).json("NOT FOUND");
});
app.listen(3000, () => {
  console.log("Server started");
});
