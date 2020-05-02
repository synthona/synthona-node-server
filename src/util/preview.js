const { Op } = require('sequelize');
const { node, association } = require('../db/models');

// function to re-generate the preview for a collection node
// TODO: revisit this to make the query more efficient if possible
exports.generateCollectionPreview = async (collectionNodeId, req) => {
  // generate collection preview
  try {
    // fetch the collection so it can be updated
    const collection = await node.findOne({ where: { id: collectionNodeId } });
    // get associations for where one of them is not a collection and
    // where one of them is the collectionNodeId which is passed in
    const result = await association.findAll({
      where: {
        [Op.and]: [
          {
            [Op.or]: [
              { nodeType: { [Op.not]: 'collection' } },
              { linkedNodeType: { [Op.not]: 'collection' } },
            ],
          },
          {
            [Op.or]: [
              { nodeId: collectionNodeId, nodeType: 'collection' },
              { linkedNode: collectionNodeId, linkedNodeType: 'collection' },
            ],
          },
        ],
      },
      limit: 4,
      //TODO: sort by linkStrength once that is working?
      order: [['updatedAt', 'DESC']],
      attributes: ['id', 'nodeId', 'linkedNode', 'linkStrength', 'updatedAt'],
      // include whichever node is the associated one for
      include: [
        {
          model: node,
          where: { id: { [Op.not]: collectionNodeId } },
          required: false,
          as: 'original',
          attributes: ['id', 'local', 'type', 'summary', 'name'],
        },
        {
          model: node,
          where: { id: { [Op.not]: collectionNodeId } },
          required: false,
          as: 'associated',
          attributes: ['id', 'local', 'type', 'summary', 'name'],
        },
      ],
    });
    // condense results to one list
    var associations = [];
    result.forEach((association) => {
      if (association.original !== null) {
        associations.push(association.original);
      } else if (association.associated !== null) {
        associations.push(association.associated);
      }
    });
    // create the collection preview
    var associationLength = associations.length;
    if (associationLength > 0) {
      var collectionPreview = [];
      associations.forEach((node) => {
        if (node.type === 'image' && node.local) {
          const fullUrl = node.summary
            ? req.protocol + '://' + req.get('host') + '/' + node.summary
            : null;
          node.summary = fullUrl;
        }
        collectionPreview.push({ summary: node.summary, type: node.type });
      });
      // save it to the database
      collection.summary = JSON.stringify(collectionPreview);
      await collection.save();
    }
    return;
  } catch (err) {
    err.statusCode = 500;
    err.message = 'Failed to generate collection preview';
    throw err;
  }
};

// temporary log to file function (will probably move this to its own util file)
// var fs = require('fs');
// var util = require('util');
// var log_file = fs.createWriteStream(__dirname + '/debug.log', { flags: 'w' });
// var log_stdout = process.stdout;

// fileLog = function (d) {
//   //
//   log_file.write(util.format(d) + '\n');
//   // log_stdout.write(util.format(d) + '\n');
// };
