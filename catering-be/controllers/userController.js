const fs        = require("fs");
const path      = require("path");
const NodeRSA   = require("node-rsa");
const { User }  = require("../models");
const bcrypt    = require("bcrypt");
const jwt       = require("jsonwebtoken");

module.exports = {
  /* =================== REGISTER =================== */
  register: async (req, res) => {
    try {
      const { firstName, lastName, email, password, phone, address } = req.body;

      if (!firstName || !email || !password || !address) {
        return res.status(400).json({
          message: "Nama depan, email, password, dan alamat wajib diisi"
        });
      }

      /* 1. Hash password & siapkan nama */
      const name  = `${firstName} ${lastName || ""}`.trim();
      const hash  = bcrypt.hashSync(password, 10);

      /* 2. Buat sepasang RSA key (2048 bit) */
      const key         = new NodeRSA({ b: 2048 });
      const privateKey  = key.exportKey("private");
      const publicKey   = key.exportKey("public");

      /* 3. Simpan key sementara (pakai time‑stamp) */
      const tempId      = Date.now();
      const keyDir      = path.join(__dirname, "..", "keys", `${tempId}`);
      fs.mkdirSync(keyDir, { recursive: true });
      fs.writeFileSync(path.join(keyDir, "private.pem"), privateKey);
      fs.writeFileSync(path.join(keyDir, "public.pem"),  publicKey);

      /* 4. Enkripsi phone & address */
      const rsa         = new NodeRSA(publicKey);
      const encPhone    = phone    ? rsa.encrypt(phone,    "base64") : null;
      const encAddress  = rsa.encrypt(address, "base64");

      /* 5. menyimpan user (phone & address sudah terenkripsi) */
      const user = await User.create({
        name,
        email,                 // plain
        password: hash,
        phone: encPhone,       // encrypted
        address: encAddress,   // encrypted
        role: "user",
        isActive: true
      });

      /* 6. Pindahkan folder key => pakai user.id */
      const finalKeyDir = path.join(__dirname, "..", "keys", `${user.id}`);
      fs.renameSync(keyDir, finalKeyDir);

      /* 7. Response  */
      return res.status(201).json({
        message: "User registered successfully!",
        user: {
          id:    user.id,
          name:  user.name,
          email: user.email,
          role:  user.role,
          phone: "[DIENKRIPSI]",
          address: "[DIENKRIPSI]"
        }
      });
    } catch (error) {
      console.error("Registration error:", error);
      if (error.name === "SequelizeUniqueConstraintError") {
        return res.status(400).json({ message: "Email sudah terdaftar" });
      }
      return res.status(500).json({ message: error.message });
    }
  },

  /* =================== LOGIN  =================== */
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ where: { email } });
      if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ message: "Invalid email or password!" });
      }
      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET
      );
      return res.status(200).json({ message: "Login successfully!", token });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  /* (Opsional) helper untuk mendekripsi saat butuh tampilkan data */
  decryptField: (encryptedBase64, userId) => {
    const privatePem = fs.readFileSync(
      path.join(__dirname, "..", "keys", `${userId}`, "private.pem"),
      "utf-8"
    );
    const rsa = new NodeRSA(privatePem);
    return rsa.decrypt(encryptedBase64, "utf8");
  }
};
