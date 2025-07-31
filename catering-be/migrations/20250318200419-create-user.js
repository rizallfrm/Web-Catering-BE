module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("Users", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      name: {
        type: Sequelize.STRING, // Fixed: Gunakan Sequelize.STRING bukan DataTypes.STRING
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "Nama tidak boleh kosong"
          },
          len: {
            args: [2, 100],
            msg: "Nama harus antara 2-100 karakter"
          }
        },
      },
      email: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false,
      },
      password: Sequelize.STRING,
      phone: Sequelize.TEXT,
      address: Sequelize.TEXT,
      role: {
        type: Sequelize.STRING,
        defaultValue: "user",
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      lastLoginAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("Users");
  },
};