const express = require("express");
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;
require("dotenv").config();
const router = express.Router();
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const User = require("../models/User");
const isAuthenticated = require("../middleware/isAuthenticated");

cloudinary.config({
  cloud_name: "di2gax2of", //process.env.CLOUD_NAME,
  api_key: "923193461254375", //process.env.API_KEY,
  api_secret: "1-vd5jYRG7qvFDwxkuao9PturVQ", //process.env.API_SECRET,
});

// Fonction pour convertir le fichier en base64
const convertToBase64 = (file) => {
  if (file && file.mimetype) {
    return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
  } else {
    console.error(
      "Le fichier est manquant ou sa propriété mimetype est indéfinie"
    );
    return null;
  }
};

router.post("/signup", fileUpload(), async (req, res) => {
  try {
    // Vérifier si toutes les informations requises sont fournies
    if (!req.body.username || !req.body.email || !req.body.password) {
      return res
        .status(400)
        .json({ message: "Nom d'utilisateur, email ou mot de passe manquant" });
    }

    // Vérifier si l'email est déjà utilisé
    const alreadyExist = await User.findOne({ email: req.body.email });
    if (alreadyExist) {
      return res.status(400).json({ message: "Email déjà utilisé" });
    }

    const salt = uid2(16);
    const hash = SHA256(req.body.password + salt).toString(encBase64);
    const token = uid2(32);

    // Gérer le cas où une image est fournie
    let profilePictureUrl = null;
    if (req.files && req.files.picture) {
      console.log("req.files", req.files.picture);
      const picture = req.files.picture;
      console.log("picture", picture);
      if (picture) {
        const pictureBase64 = convertToBase64(req.files.picture); // Convertir le fichier en base64
        console.log("pictureBase64", pictureBase64);
        if (pictureBase64) {
          const cloudinaryResponse = await cloudinary.uploader.upload(
            pictureBase64
          );
          profilePictureUrl = cloudinaryResponse.secure_url; // Récupérer l'URL sécurisée de l'image
          console.log("profilePicture URL", profilePictureUrl);
        }
      }
    }

    const newUser = new User({
      username: req.body.username,
      email: req.body.email,
      profilePictureUrl: profilePictureUrl,
      token: token,
      hash: hash,
      salt: salt,
    });

    await newUser.save();
    console.log("Utilisateur enregistré avec succès :", newUser);

    // Créer l'objet de réponse
    const responseObj = {
      _id: newUser._id,
      token: newUser.token,
      account: { username: newUser.username },
    };

    return res
      .status(201)
      .json({ message: "Nouveau compte créé", user: responseObj });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    console.log("Je suis dans la route /login");

    const userFound = await User.findOne({ username: req.body.username });

    if (!userFound) {
      return res.status(400).json("Username ou mot de passe incorrect");
    }

    // Vérifier le mot de passe en comparant les hashes
    const newHash = SHA256(req.body.password + userFound.salt).toString(
      encBase64
    );
    if (newHash === userFound.hash) {
      const responseObj = {
        _id: userFound._id,
        token: userFound.token,
        account: { username: userFound.username },
      };

      return res.status(200).json(responseObj);
    } else {
      return res.status(401).json("Email ou mot de passe incorrect");
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});
// Middleware pour vérifier l'authentification
router.use(isAuthenticated);

router.get("/profile", async (req, res) => {
  try {
    const userId = req.user._id;

    // Rechercher l'utilisateur dans la base de données
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      picture: user.profilePictureUrl,
    });
  } catch (error) {
    console.error("Error fetching profile data:", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
