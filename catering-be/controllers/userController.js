const { User } = require("../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

module.exports = {
  register: async (req, res) => {
    try {
      const { name, email, password, phone, address } = req.body;
      const hash = bcrypt.hashSync(password, 10);
      const user = await User.create({
        name,
        email,
        password: hash,
        phone,
        address,
        role: "user",
      });

      res.status(201).json({
        message: "User registered successfully!",
        user,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({
        where: {
          email,
        },
      });
      if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({
          message: "Invalid email or password!",
        });
      }
      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET
      );
      res.status(200).json({
        message: "Login successfully!",
        token,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
};
