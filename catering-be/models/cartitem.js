"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class CartItem extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      CartItem.belongsTo(models.Menu, { foreignKey: "menu_id" });
      CartItem.belongsTo(models.Cart, { foreignKey: "cart_id" });
    }
  }
  CartItem.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      cart_id: DataTypes.UUID,
      menu_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "Menus",
          key: "id",
        },
      },
      quantity: DataTypes.INTEGER,
      subtotal: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "CartItem",
    }
  );
  return CartItem;
};
