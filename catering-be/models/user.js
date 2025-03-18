'use strict';
const {
  Model
} = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.Cart, { foreignKey: 'user_id' });
      User.hasMany(models.Order, { foreignKey: 'user_id' });
    }
  }

  User.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: DataTypes.STRING,
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    password: DataTypes.STRING,
    phone: DataTypes.STRING,
    address: DataTypes.TEXT,
    role: {
      type: DataTypes.STRING,
      defaultValue: 'user'
    }
  }, {
    sequelize,
    modelName: 'User',
  });

  return User;
};
