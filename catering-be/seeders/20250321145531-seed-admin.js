'use strict';

const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash("admin123", 10);

    await queryInterface.bulkInsert('Users', [{
      id: uuidv4(),
      name: 'Super Admin',
      email: 'admin@example.com',
      password: hashedPassword,
      phone: '08123456789',
      address: 'Admin HQ',
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Users', { email: 'admin@example.com' }, {});
  }
};
