"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("Expenses", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: "Nama/judul pengeluaran"
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: "Deskripsi detail pengeluaran"
      },
      amount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: "Jumlah pengeluaran dalam rupiah"
      },
      category: {
        type: Sequelize.ENUM(
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
        comment: "Kategori pengeluaran"
      },
      expense_date: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: "Tanggal pengeluaran"
      },
      receipt_image_url: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: "URL foto struk/nota"
      },
      supplier: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: "Nama supplier/toko"
      },
      payment_method: {
        type: Sequelize.ENUM(
          'Cash',
          'Transfer',
          'Credit Card',
          'Debit Card',
          'E-Wallet'
        ),
        allowNull: false,
        defaultValue: 'Cash',
        comment: "Metode pembayaran"
      },
      status: {
        type: Sequelize.ENUM(
          'Pending',
          'Approved',
          'Rejected'
        ),
        allowNull: false,
        defaultValue: 'Pending',
        comment: "Status approval pengeluaran"
      },
      approved_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "Users",
          key: "id",
        },
        comment: "User yang approve pengeluaran"
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        },
        onDelete: "CASCADE",
        comment: "User yang membuat record pengeluaran"
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: "Catatan tambahan"
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("Expenses");
    
    // Drop enums
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_Expenses_category";'
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_Expenses_payment_method";'
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_Expenses_status";'
    );
  },
};