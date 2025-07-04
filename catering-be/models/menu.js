"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Menu extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Menu.hasMany(models.CartItem, { foreignKey: "menu_id" });
      Menu.hasMany(models.OrderItem, { foreignKey: "menu_id" });
    }
  }
  Menu.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: DataTypes.STRING,
      category: DataTypes.STRING,
      description: DataTypes.TEXT,
      price: DataTypes.INTEGER,
      image_url: DataTypes.TEXT,
      available: DataTypes.BOOLEAN,
      min_order: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Menu",
    }
  );
  return Menu;
};
