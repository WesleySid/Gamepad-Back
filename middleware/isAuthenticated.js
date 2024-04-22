const User = require("../models/User");

const isAuthenticated = async (req, res, next) => {
  try {
    // Exclure la vérification du token pour la route de création de compte
    if (req.path === "/signup") {
      return next();
    }

    const token = req.headers.authorization;
    if (!token) {
      return res.status(400).json({ message: "Token is missing" });
    }
    if (!token.startsWith("Bearer ")) {
      return res.status(400).json({ message: "Invalid token format" });
    }
    const tokenWithoutPrefix = token.replace("Bearer ", "");
    const user = await User.findOne({ token: tokenWithoutPrefix });
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = isAuthenticated;
