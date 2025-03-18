'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Order.belongsTo(models.User, { foreignKey: 'user_id' });
      Order.hasMany(models.OrderItem, { foreignKey: 'order_id' });    }
  }
  Order.init({
    user_id: DataTypes.UUID,
    status: DataTypes.STRING,
    total_price: DataTypes.INTEGER,
    proof_image_url: DataTypes.STRING,
    wa_number: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Order',
  });
  return Order;
};