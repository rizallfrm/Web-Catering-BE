"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Order.belongsTo(models.User, { foreignKey: "user_id" });
      Order.hasMany(models.OrderItem, { foreignKey: "order_id" });
    }
  }
  Order.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      user_id: DataTypes.UUID,
      status: {
        type: DataTypes.ENUM(
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
        type: DataTypes.ENUM(
          "Belum Bayar",
          "Menunggu Verifikasi",
          "Sudah Dibayar",
          "Dibatalkan"
        ),
        defaultValue: "Belum Bayar",
      },
      total_price: DataTypes.INTEGER,
      proof_image_url: DataTypes.STRING,
      wa_number: DataTypes.STRING,
      weekly_schedule: {
        type: DataTypes.JSON,
        defaultValue: null,
      },

      //ongkir
      delivery_fee: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: "Biaya pengiriman",
      },
      delivery_area: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "Area pengiriman yang terdeteksi",
      },
      delivery_confidence: {
        type: DataTypes.ENUM("high", "medium", "low", "none"),
        defaultValue: "none",
        comment: "Tingkat kepercayaan deteksi area",
      },
      delivery_method: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "Metode deteksi yang digunakan",
      },

      
      // pengiriman
      delivery_date: DataTypes.DATE,
      delivery_address: DataTypes.STRING,
      delivery_status: {
        type: DataTypes.ENUM(
          "Menunggu Jadwal",
          "Sedang Diproses",
          "Dalam Pengiriman",
          "Terkirim",
          "Dibatalkan"
        ),
        defaultValue: "Menunggu Jadwal",
      },
      delivery_notes: DataTypes.TEXT,
    },

    //ongkir

    {
      sequelize,
      modelName: "Order",
    }
  );
  return Order;
};
