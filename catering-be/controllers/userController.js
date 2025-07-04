const { User } = require("../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

module.exports = {
  register: async (req, res) => {
    try {
      const { firstName, lastName, email, password, phone,address } = req.body;
      
      // Validasi input
      if (!firstName || !email || !password) {
        return res.status(400).json({ 
          message: "Nama depan, email, dan password wajib diisi" 
        });
      }
  
      // Gabungkan nama depan dan belakang
      const name = `${firstName} ${lastName || ''}`.trim();
  
      const hash = bcrypt.hashSync(password, 10);
      
      const user = await User.create({
        name,
        email,
        address,
        password: hash,
        phone: phone || null,
        role: "user",
        isActive: true
      });
  
      res.status(201).json({
        message: "User registered successfully!",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          address: user.address,
          phone: user.phone,
          role: user.role
        }
      });
    } catch (error) {
      console.error("Registration error:", error);
      
      // Tangani error unique constraint untuk email
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ 
          message: "Email sudah terdaftar"
        });
      }
  
      res.status(500).json({ 
        message: "Terjadi kesalahan saat registrasi",
        error: error.message 
      });
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
