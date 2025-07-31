"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Expense extends Model {
    static associate(models) {
      // Expense belongs to User (created_by)
      Expense.belongsTo(models.User, { 
        foreignKey: "created_by",
        as: "CreatedBy"
      });
      
      // Expense belongs to User (approved_by)
      Expense.belongsTo(models.User, { 
        foreignKey: "approved_by",
        as: "ApprovedBy"
      });
    }
  }
  
  Expense.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [3, 255]
        }
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      amount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 0
        }
      },
      category: {
        type: DataTypes.ENUM(
          'Bahan Baku',
          'Peralatan',
          'Operasional',
          'Transport',
          'Marketing',
          'Gaji',
          'Utilities',
          'Maintenance',
          'Lainnya'
        ),
        allowNull: false,
        defaultValue: 'Lainnya',
      },
      expense_date: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
          isDate: true,
          notEmpty: true
        }
      },
      receipt_image_url: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      supplier: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      payment_method: {
        type: DataTypes.ENUM(
          'Cash',
          'Transfer',
          'Credit Card',
          'Debit Card',
          'E-Wallet'
        ),
        allowNull: false,
        defaultValue: 'Cash',
      },
      status: {
        type: DataTypes.ENUM(
          'Pending',
          'Approved',
          'Rejected'
        ),
        allowNull: false,
        defaultValue: 'Pending',
      },
      approved_by: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      created_by: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      }
    },
    {
      sequelize,
      modelName: "Expense",
      tableName: "Expenses",
      timestamps: true,
    }
  );
  
  return Expense;
};