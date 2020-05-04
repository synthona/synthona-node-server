'use strict';
module.exports = (sequelize, DataTypes) => {
  const node = sequelize.define(
    'node',
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
        comment: 'The node ID',
      },
      local: {
        allowNull: false,
        type: DataTypes.BOOLEAN,
        comment: 'is the node local to this instance or out on the external network?',
      },
      hidden: {
        allowNull: false,
        type: DataTypes.BOOLEAN,
        comment: 'can it be accessed directly or only through its associations?',
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'The Node type',
      },
      name: {
        type: DataTypes.STRING,
        comment: 'The name of the node',
      },
      summary: {
        type: DataTypes.STRING(500),
        comment: 'the summary description data',
      },
      content: {
        type: DataTypes.TEXT,
        comment: 'the content',
      },
      color: {
        type: DataTypes.STRING,
        comment: 'The associated color',
      },
      impressions: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'The number of times a node has been sent to a Client',
      },
      views: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'The number of times a node has been Accessed',
      },
      creator: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'The creator of the node',
      },
      createdFrom: {
        type: DataTypes.INTEGER,
        comment: 'last node viewed before this was created',
      },
      viewedAt: {
        type: DataTypes.DATE,
        comment: 'last date this node was viewed',
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
    },
    { freezeTableName: true }
  );
  node.associate = function (models) {
    // associations can be defined here
    node.belongsTo(models.user, { constraints: false, foreignKey: 'creator' });
    node.belongsTo(models.association, {
      as: 'original',
      constraints: false,
      foreignKey: 'id',
      targetKey: 'nodeId',
    });
    node.belongsTo(models.association, {
      as: 'associated',
      constraints: false,
      foreignKey: 'id',
      targetKey: 'linkedNode',
    });
    node.hasOne(models.user, { foreignKey: 'nodeId', sourceKey: 'id' });
  };
  return node;
};
