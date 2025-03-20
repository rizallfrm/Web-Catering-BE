'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('CartItems', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      cart_id: {
        type: Sequelize.UUID,
        references: {
          model: 'Carts',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      menu_id: {
        type: Sequelize.UUID,
        references: {
          model: 'Menus',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      quantity: Sequelize.INTEGER,
      subtotal: Sequelize.INTEGER,
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('CartItems');
  }
};
