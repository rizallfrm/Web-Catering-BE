"use strict";

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_Orders_status";`
    );
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_Orders_payment_status";`
    );
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_Orders_delivery_status";`
    );
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_Orders_delivery_status";`
    );
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_Orders_payment_status";`
    );
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_Orders_status";`
    );
  },
};
