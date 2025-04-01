"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("Menus", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      name: Sequelize.STRING,
      description: Sequelize.TEXT,
      price: Sequelize.INTEGER,
      image_url: Sequelize.TEXT,
      available: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("Menus");
  },
};
