"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("OrderItems", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      order_id: {
        type: Sequelize.UUID,
        references: {
          model: "Orders",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      menu_id: {
        type: Sequelize.UUID,
        references: {
          model: "Menus",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      quantity: Sequelize.INTEGER,
      price: Sequelize.INTEGER,
      subtotal: Sequelize.INTEGER,
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("OrderItems");
  },
};
