'use strict';
module.exports = (sequelize, DataTypes) => {
  const association = sequelize.define(
    'association',
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
        comment: 'The Association ID'
      },
      nodeId: {
        type: DataTypes.INTEGER,
        comment: 'The Node which is being associated',
        unique: false
      },
      linkedNode: {
        type: DataTypes.INTEGER,
        comment: 'the node being linked to',
        unique: false
      },
      linkStrength: {
        type: DataTypes.INTEGER,
        comment: 'left associated node association strength'
      },
      creator: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'The creator of the association'
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE
      }
    },
    { freezeTableName: true }
  );
  association.associate = function(models) {
    // associations can be defined here
    association.belongsTo(models.user, { constraints: false, foreignKey: 'creator' });
    association.belongsTo(models.node, {
      as: 'original',
      constraints: false,
      foreignKey: 'nodeId',
      targetKey: 'id'
    });
    association.belongsTo(models.node, {
      as: 'associated',
      constraints: false,
      foreignKey: 'linkedNode',
      targetKey: 'id'
    });
  };
  return association;
};
