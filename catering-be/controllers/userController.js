const fs = require("fs");
const path = require("path");
const NodeRSA = require("node-rsa");
const { User } = require("../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");

// Helper function untuk validasi nama
const validateName = (name) => {
  if (!name || name.trim() === "") {
    return "Nama wajib diisi";
  }
  
  const trimmedName = name.trim();
  
  // Cek apakah hanya berisi angka
  if (/^\d+$/.test(trimmedName)) {
    return "Nama tidak boleh hanya berisi angka";
  }
  
  // Cek format nama yang valid (huruf di awal, spasi/apostrof/tanda hubung di tengah, angka opsional di akhir)
  if (!/^[a-zA-Z][a-zA-Z\s'-]*[a-zA-Z0-9]?$/.test(trimmedName)) {
    return "Nama harus diawali huruf, boleh mengandung spasi, apostrof ('), tanda hubung (-), dan angka di akhir";
  }
  
  // Cek panjang minimum
  if (trimmedName.length < 2) {
    return "Nama minimal 2 karakter";
  }
  
  // Cek apakah hanya angka di tengah atau awal
  if (/^\d/.test(trimmedName)) {
    return "Nama tidak boleh diawali dengan angka";
  }
  
  // Cek apakah ada karakter berulang yang tidak wajar (skip angka di akhir)
  const nameWithoutEndNumbers = trimmedName.replace(/\d+$/, '');
  if (/(.)\1{2,}/.test(nameWithoutEndNumbers.replace(/\s/g, ""))) {
    return "Nama tidak boleh memiliki karakter yang berulang lebih dari 2 kali";
  }
  
  // Pastikan nama mengandung minimal satu huruf
  if (!/[a-zA-Z]/.test(trimmedName)) {
    return "Nama harus mengandung minimal satu huruf";
  }
  
  // Validasi Title Case - setiap kata harus diawali huruf kapital
  const words = trimmedName.split(/[\s'-]+/);
  for (let word of words) {
    if (word.length > 0) {
      // Skip angka di akhir nama
      const letterPart = word.replace(/\d+$/, '');
      if (letterPart.length > 0 && !/^[A-Z]/.test(letterPart)) {
        return "Setiap kata dalam nama harus diawali huruf kapital (contoh: Jali Firman2)";
      }
    }
  }
  
  return null; // Valid
};

// Helper function untuk format Title Case
const formatToTitleCase = (name) => {
  if (!name) return name;
  
  return name.trim().replace(/\w\S*/g, (txt) => {
    // Pertahankan angka di akhir, hanya format bagian huruf
    const match = txt.match(/^([a-zA-Z]+)(\d*)$/);
    if (match) {
      const letters = match[1];
      const numbers = match[2];
      return letters.charAt(0).toUpperCase() + letters.slice(1).toLowerCase() + numbers;
    }
    return txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase();
  });
};

// Helper function untuk mengecek duplikasi nomor telepon
const checkDuplicatePhone = async (phone) => {
  if (!phone || phone.trim() === "") return null;
  
  const normalizedPhone = phone.replace(/[^0-9]/g, ""); // Hapus semua karakter non-digit
  
  // Cari semua user yang memiliki nomor telepon
  const allUsers = await User.findAll({
    where: {
      phone: { [Op.ne]: null }
    }
  });

  for (let user of allUsers) {
    try {
      const decryptedPhone = module.exports.decryptField(user.phone, user.id);
      const normalizedExistingPhone = decryptedPhone.replace(/[^0-9]/g, "");
      
      if (normalizedPhone === normalizedExistingPhone) {
        return "Nomor telepon sudah terdaftar. Silakan gunakan nomor telepon lain.";
      }
    } catch (decryptError) {
      // Skip jika tidak bisa dekripsi (data corrupt atau key tidak ada)
      console.warn(`Cannot decrypt phone for user ${user.id}:`, decryptError.message);
      continue;
    }
  }
  
  return null; // Tidak ada duplikasi
};

// Helper function untuk mengecek nama duplikat
const checkDuplicateName = async (firstName, lastName) => {
  const fullName = `${firstName} ${lastName || ""}`.trim();
  
  const existingUser = await User.findOne({
    where: {
      name: {
        [Op.iLike]: fullName // Case insensitive
      }
    }
  });
  
  if (existingUser) {
    return "Nama sudah terdaftar. Silakan gunakan nama yang berbeda atau tambahkan angka di belakang nama (contoh: Jali Firman2)";
  }
  
  return null;
};

module.exports = {
  /* =================== REGISTER =================== */
  register: async (req, res) => {
    try {
      const { firstName, lastName, email, password, phone, address } = req.body;

      // Validasi field yang wajib
      if (!firstName || !email || !password || !address) {
        return res.status(400).json({
          message: "Nama depan, email, password, dan alamat wajib diisi",
        });
      }

      // Validasi nama depan
      const firstNameError = validateName(firstName);
      if (firstNameError) {
        return res.status(400).json({
          message: `Nama depan: ${firstNameError}`,
        });
      }

      // Validasi nama belakang (jika ada)
      if (lastName && lastName.trim() !== "") {
        const lastNameError = validateName(lastName);
        if (lastNameError) {
          return res.status(400).json({
            message: `Nama belakang: ${lastNameError}`,
          });
        }
      }

      // Validasi email format
      const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          message: "Format email tidak valid",
        });
      }

      // Validasi password
      if (password.length < 6) {
        return res.status(400).json({
          message: "Password minimal 6 karakter",
        });
      }

      if (!/^(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
        return res.status(400).json({
          message: "Password harus mengandung minimal 1 huruf dan 1 angka",
        });
      }

      // Validasi nomor telepon
      if (phone) {
        const phoneRegex = /^[0-9+\-\s()]*$/;
        if (!phoneRegex.test(phone)) {
          return res.status(400).json({
            message: "Format nomor telepon tidak valid",
          });
        }

        const digitsOnly = phone.replace(/[^0-9]/g, "");
        if (digitsOnly.length < 10 || digitsOnly.length > 13) {
          return res.status(400).json({
            message: "Nomor telepon harus antara 10-13 digit",
          });
        }

        if (!/^(\+62|0)/.test(phone)) {
          return res.status(400).json({
            message: "Nomor telepon harus diawali dengan +62 atau 0",
          });
        }
      }

      // Validasi alamat
      if (address.length < 10) {
        return res.status(400).json({
          message: "Alamat minimal 10 karakter",
        });
      }

      // Cek duplikasi email
      const existingEmail = await User.findOne({
        where: { email: email.toLowerCase() }
      });

      if (existingEmail) {
        return res.status(400).json({
          message: "Email sudah terdaftar. Silakan gunakan email lain.",
        });
      }

      // Cek duplikasi nomor telepon (jika nomor telepon diisi)
      if (phone && phone.trim() !== "") {
        const duplicatePhoneError = await checkDuplicatePhone(phone);
        if (duplicatePhoneError) {
          return res.status(400).json({
            message: duplicatePhoneError,
          });
        }
      }

      // Cek duplikasi nama
      const duplicateNameError = await checkDuplicateName(firstName.trim(), lastName ? lastName.trim() : "");
      if (duplicateNameError) {
        return res.status(400).json({
          message: duplicateNameError,
        });
      }

      /* 1. Hash password & siapkan nama dengan format Title Case */
      const formattedFirstName = formatToTitleCase(firstName.trim());
      const formattedLastName = lastName ? formatToTitleCase(lastName.trim()) : "";
      const name = `${formattedFirstName} ${formattedLastName}`.trim();
      const hash = bcrypt.hashSync(password, 10);

      /* 2. Buat sepasang RSA key (2048 bit) */
      const key = new NodeRSA({ b: 2048 });
      const privateKey = key.exportKey("private");
      const publicKey = key.exportKey("public");

      /* 3. Simpan key sementara (pakai time‑stamp) */
      const tempId = Date.now();
      const keyDir = path.join(__dirname, "..", "keys", `${tempId}`);
      fs.mkdirSync(keyDir, { recursive: true });
      fs.writeFileSync(path.join(keyDir, "private.pem"), privateKey);
      fs.writeFileSync(path.join(keyDir, "public.pem"), publicKey);

      /* 4. Enkripsi phone & address */
      const rsa = new NodeRSA(publicKey);
      const encPhone = phone ? rsa.encrypt(phone, "base64") : null;
      const encAddress = rsa.encrypt(address, "base64");

      /* 5. menyimpan user (phone & address sudah terenkripsi) */
      const user = await User.create({
        name,
        email: email.toLowerCase(),
        password: hash,
        phone: encPhone,
        address: encAddress,
        role: "user",
        isActive: true,
      });

      /* 6. Pindahkan folder key => pakai user.id */
      const finalKeyDir = path.join(__dirname, "..", "keys", `${user.id}`);
      fs.renameSync(keyDir, finalKeyDir);

      /* 7. Response  */
      return res.status(201).json({
        message: "Pendaftaran berhasil! Silakan login dengan akun Anda.",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: "[DIENKRIPSI]",
          address: "[DIENKRIPSI]",
        },
      });
    } catch (error) {
      console.error("Registration error:", error);
      
      // Cleanup temporary key directory if exists
      if (error.tempId) {
        const tempKeyDir = path.join(__dirname, "..", "keys", `${error.tempId}`);
        if (fs.existsSync(tempKeyDir)) {
          fs.rmSync(tempKeyDir, { recursive: true, force: true });
        }
      }
      
      if (error.name === "SequelizeUniqueConstraintError") {
        if (error.fields && error.fields.email) {
          return res.status(400).json({ 
            message: "Email sudah terdaftar. Silakan gunakan email lain." 
          });
        }
        return res.status(400).json({ 
          message: "Data yang Anda masukkan sudah terdaftar." 
        });
      }
      
      return res.status(500).json({ 
        message: "Terjadi kesalahan sistem. Silakan coba lagi nanti." 
      });
    }
  },

  /* =================== LOGIN  =================== */
  login: async (req, res) => {
    try {
      const { identifier, password } = req.body;

      // Log untuk debugging (hapus di production)
      console.log("=== LOGIN ATTEMPT ===");
      console.log("Identifier:", identifier);
      console.log("Password length:", password?.length);

      if (!identifier || !password) {
        console.log("❌ Missing credentials");
        return res
          .status(400)
          .json({ message: "Email/Nama dan password wajib diisi!" });
      }

      // Format identifier untuk pencarian yang lebih fleksibel
      const searchIdentifier = identifier.trim();
      const formattedIdentifier = formatToTitleCase(searchIdentifier);

      console.log("Search variations:", {
        original: searchIdentifier,
        formatted: formattedIdentifier,
        lowercase: searchIdentifier.toLowerCase()
      });

      // Cari user berdasarkan email ATAU name (case insensitive)
      const user = await User.findOne({
        where: {
          [Op.or]: [
            // Pencarian email (case insensitive)
            { email: { [Op.iLike]: searchIdentifier.toLowerCase() } },
            // Pencarian nama dengan berbagai format (case insensitive)
            { name: { [Op.iLike]: searchIdentifier } },
            { name: { [Op.iLike]: formattedIdentifier } },
          ],
        },
      });

      console.log("User search result:", user ? {
        id: user.id,
        name: user.name,
        email: user.email,
        isActive: user.isActive
      } : "Not found");

      if (!user) {
        console.log("❌ User not found");
        return res.status(401).json({ 
          message: "Email/Nama atau password salah!" 
        });
      }

      // Validasi password
      const validPassword = bcrypt.compareSync(password, user.password);
      console.log("Password validation result:", validPassword);
      
      if (!validPassword) {
        console.log("❌ Invalid password");
        return res.status(401).json({ 
          message: "Email/Nama atau password salah!" 
        });
      }

      // Cek apakah user aktif
      if (user.isActive === false) {
        console.log("❌ User inactive");
        return res.status(401).json({ 
          message: "Akun Anda sedang tidak aktif. Silakan hubungi administrator." 
        });
      }

      // Update last login timestamp
      try {
        await user.update({ lastLoginAt: new Date() });
        console.log("✅ Last login updated");
      } catch (updateError) {
        console.warn("⚠️ Failed to update lastLoginAt:", updateError.message);
        // Don't fail the login if we can't update timestamp
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          id: user.id, 
          role: user.role,
          email: user.email,
          name: user.name
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      console.log("✅ Login successful");
      console.log("Generated token length:", token.length);

      const responseData = {
        message: "Login berhasil!",
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      };

      console.log("Response data:", { ...responseData, token: `${token.substring(0, 20)}...` });
      
      return res.status(200).json(responseData);
    } catch (error) {
      console.error("❌ Login error:", error);
      return res.status(500).json({ 
        message: "Terjadi kesalahan sistem. Silakan coba lagi nanti." 
      });
    }
  },

  /* =================== GET PROFILE =================== */
  getProfile: async (req, res) => {
    try {
      const userId = req.user.id;
      
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ 
          message: "User tidak ditemukan" 
        });
      }

      // Dekripsi data jika diperlukan
      let decryptedPhone = null;
      let decryptedAddress = null;

      try {
        if (user.phone) {
          decryptedPhone = module.exports.decryptField(user.phone, userId);
        }
        if (user.address) {
          decryptedAddress = module.exports.decryptField(user.address, userId);
        }
      } catch (decryptError) {
        console.error("Decryption error:", decryptError);
        // Jika dekripsi gagal, tetap tampilkan data lain
      }

      return res.status(200).json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: decryptedPhone,
          address: decryptedAddress,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      });
    } catch (error) {
      console.error("Get profile error:", error);
      return res.status(500).json({ 
        message: "Terjadi kesalahan sistem. Silakan coba lagi nanti." 
      });
    }
  },

  /* (Helper) untuk mendekripsi saat butuh tampilkan data */
  decryptField: (encryptedBase64, userId) => {
    try {
      const privatePem = fs.readFileSync(
        path.join(__dirname, "..", "keys", `${userId}`, "private.pem"),
        "utf-8"
      );
      const rsa = new NodeRSA(privatePem);
      return rsa.decrypt(encryptedBase64, "utf8");
    } catch (error) {
      console.error("Decrypt field error:", error);
      throw new Error("Gagal mendekripsi data");
    }
  },
};