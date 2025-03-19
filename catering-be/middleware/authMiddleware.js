require("dotenv").config(); // ini wajib di atas semua!

const jwt = require("jsonwebtoken");

exports.authenthicate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  console.log("🔑 TOKEN:", token);
  console.log("🔐 JWT_SECRET:", process.env.JWT_SECRET);
  if (!token) return res.status(401).json({ message: "Token not provided!" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("SECRET YANG DIGUNAKAN:", process.env.JWT_SECRET);

    req.user = decoded; // {id, role}
    next();
  } catch (error) {
    res.status(403).json({ message: "Invalid token!" });
  }
};

exports.authorize = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "You are not authorized!" });
    }
    next();
  };
};
