"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("Orders", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      user_id: {
        type: Sequelize.UUID,
        references: {
          model: "Users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      status: {
        type: Sequelize.ENUM(
          "Menunggu Konfirmasi",
          "Dikonfirmasi",
          "Menunggu Verifikasi",
          "Diproses",
          "Dikirim",
          "Selesai",
          "Dibatalkan"
        ),
        defaultValue: "Menunggu Konfirmasi",
      },
      payment_status: {
        type: Sequelize.ENUM(
          "Belum Bayar",
          "Menunggu Verifikasi",
          "Sudah Dibayar",
          "Dibatalkan"
        ),
        defaultValue: "Belum Bayar",
      },
      payment_proof: Sequelize.STRING,
      total_price: Sequelize.INTEGER,
      proof_image_url: Sequelize.STRING,
      weekly_schedule: {
        type: Sequelize.JSON,
        defaultValue: null,
      },
      
      // TAMBAHAN: Ongkir fields
      delivery_fee: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: "Biaya pengiriman"
      },
      delivery_area: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: "Area pengiriman yang terdeteksi"
      },
      delivery_confidence: {
        type: Sequelize.ENUM('high', 'medium', 'low', 'none'),
        defaultValue: 'none',
        comment: "Tingkat kepercayaan deteksi area"
      },
      delivery_method: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: "Metode deteksi yang digunakan"
      },
      
      // Existing delivery fields
      delivery_date: Sequelize.DATE,
      delivery_address: Sequelize.STRING,
      delivery_status: {
        type: Sequelize.ENUM(
          "Menunggu Jadwal",
          "Sedang Diproses",
          "Dalam Pengiriman",
          "Terkirim",
          "Dibatalkan"
        ),
        defaultValue: "Menunggu Jadwal",
      },
      delivery_notes: Sequelize.TEXT,
      wa_number: Sequelize.STRING,
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("Orders");

    // Hapus enum secara eksplisit agar tidak menyebabkan error saat migrate ulang
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_Orders_status";'
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_Orders_payment_status";'
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_Orders_delivery_status";'
    );
    // TAMBAHAN: Drop enum untuk delivery_confidence
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_Orders_delivery_confidence";'
    );
  },
};