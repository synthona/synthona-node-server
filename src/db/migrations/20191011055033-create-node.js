'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('node', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
        comment: 'The node ID'
      },
      local: {
        allowNull: false,
        type: Sequelize.BOOLEAN,
        comment: 'is the node local to this instance or out on the external network?'
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'The Node type'
      },
      name: {
        type: Sequelize.STRING,
        comment: 'The name of the node'
      },
      summary: {
        type: Sequelize.STRING(500),
        comment: 'the summary description data'
      },
      content: {
        type: Sequelize.TEXT,
        comment: 'the content'
      },
      color: {
        type: Sequelize.STRING,
        comment: 'The associated color'
      },
      impressions: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'The number of times a node has been sent to a Client'
      },
      views: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'The number of times a node has been Accessed'
      },
      creator: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'The creator of the node'
      },
      createdFrom: {
        type: Sequelize.INTEGER,
        comment: 'last node viewed before this was created'
      },
      viewedAt: {
        type: Sequelize.DATE,
        comment: 'last date this node was viewed'
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
    return queryInterface.dropTable('node');
  }
};
