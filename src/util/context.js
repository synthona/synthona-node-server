const { Op } = require('sequelize');
const { node, association } = require('../db/models');

//TODO: refactor most of these so you pass in a id to alter something
// also think about how permissions will hook into this

exports.deleteAssociations = async (id) => {
  try {
    await association.destroy({
      where: {
        [Op.or]: [{ nodeId: id }, { linkedNode: id }],
      },
    });
  } catch (err) {
    err.statusCode = 500;
    err.message = 'Failed to delete associations';
  }
};

// function to create new node in the context system
exports.createNode = async (item, type) => {
  // if the type is user make sure the creator variable is set
  if (type === 'user') {
    item.creator = item.id;
  }
  // create node
  try {
    const result = await node.create({
      local: true,
      hidden: false,
      searchable: true,
      type: type,
      name: 'New ' + type,
      creator: item.creator,
    });
    // add association to the item
    const updatedNode = await item.setNode(result);
    return updatedNode;
  } catch (err) {
    err.statusCode = 500;
    err.message = 'Failed to add node to context system';
  }
};

// TODO: this is very confusing to have this be a id while everything else isn't?
exports.setNodeName = async (id, name) => {
  // set the name
  try {
    const result = await node.findOne({
      where: {
        id: id,
      },
    });
    result.name = name;
    const updatedNode = await result.save();
    return updatedNode;
  } catch (err) {
    err.statusCode = 500;
    err.message = 'Failed to update name in context system';
  }
};

exports.setNodeSummary = async (item, summary) => {
  // set the summary
  try {
    const result = await node.findOne({
      where: {
        id: item.id,
      },
    });
    result.summary = summary;
    const updatedNode = await result.save();
    return updatedNode;
  } catch (err) {
    err.statusCode = 500;
    err.message = 'Failed to update summary in context system';
  }
};

// exports.setNodeContent = async (item, content) => {
//   // set the content
//   try {
//     const result = await node.findOne({
//       where: {
//         id: item.id
//       }
//     });
//     result.content = content;
//     const updatedNode = await result.save();
//     return updatedNode;
//   } catch (err) {
//     err.statusCode = 500;
//     err.message = 'Failed to update content in context system';
//     throw err;
//   }
// };

// function to remove a node from the context system
exports.removeNode = async (item, type) => {
  // remove it
  try {
    // retrieve node from database
    const result = await node.findOne({
      where: {
        id: item.id,
        type: type,
      },
    });
    // if there is a node destroy it
    if (result) {
      // delete node and send response
      await result.destroy();
    }
  } catch (err) {
    err.statusCode = 500;
    err.message = 'Failed to remove node from context system';
  }
};

// temporary?
exports.markNodeView = async (uuid) => {
  // mark the node as viewed
  try {
    const result = await node.findOne({
      where: {
        uuid: uuid,
      },
    });
    if (result.views !== null) {
      result.views++;
    } else {
      result.views = 1;
    }
    const updatedNode = await result.save();
    return updatedNode;
  } catch (err) {
    err.statusCode = 500;
    err.message = 'Failed to mark view in context system';
  }
};
