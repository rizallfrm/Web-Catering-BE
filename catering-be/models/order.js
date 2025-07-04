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
    {
      sequelize,
      modelName: "Order",
    }
  );
  return Order;
};
