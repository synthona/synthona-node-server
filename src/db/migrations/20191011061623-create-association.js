'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('association', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
        comment: 'The Association ID'
      },
      nodeId: {
        type: Sequelize.INTEGER,
        comment: 'The Node which is being associated'
      },
      linkedNode: {
        type: Sequelize.INTEGER,
        comment: 'the node being linked t'
      },
      linkStrength: {
        type: Sequelize.INTEGER,
        comment: 'left associated node association strength'
      },
      creator: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'The creator of the association'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('association');
  }
};
