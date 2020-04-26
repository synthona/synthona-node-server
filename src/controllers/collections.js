const { Op } = require('sequelize');
// custom code
const { validationResult } = require('express-validator/check');
// bring in data models.
const { node, association } = require('../db/models');

exports.createCollection = async (req, res, next) => {
  // this comes from the is-auth middleware
  const userId = req.user.uid;
  const errors = validationResult(req);
  try {
    // catch validation errors
    if (!errors.isEmpty()) {
      const error = new Error('Validation Failed');
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }
    // process request
    const name = req.body.name || 'empty collection';
    const summary = req.body.summary || '';
    // create collection
    const result = await node.create({
      local: true,
      type: 'collection',
      name: name,
      summary: summary,
      creator: userId
    });
    // send response
    res.status(200).json({ collection: result });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getCollection = async (req, res, next) => {
  // this comes from the is-auth middleware
  const userId = req.user.uid;
  try {
    // catch validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error('Validation Failed');
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }
    // process request
    var currentPage = req.query.page || 1;
    var nodeId = req.query.nodeId;
    var perPage = 15;
    // get the total node count
    const data = await association.findAndCountAll({
      where: {
        creator: userId,
        [Op.or]: [{ nodeId: nodeId }, { linkedNode: nodeId }]
      }
      // logging: console.log
    });
    // retrieve nodes for the requested page
    const totalItems = data.count;
    const result = await association.findAll({
      where: {
        creator: userId,
        [Op.or]: [{ nodeId: nodeId }, { linkedNode: nodeId }]
      },
      offset: (currentPage - 1) * perPage,
      limit: perPage,
      order: [['updatedAt', 'DESC']],
      attributes: ['id', 'nodeId', 'linkedNode', 'linkStrength', 'updatedAt'],
      // logging: console.log,
      // include whichever node is the associated one for
      include: [
        {
          model: node,
          where: { id: { [Op.not]: nodeId } },
          required: false,
          as: 'original',
          attributes: ['id', 'type', 'name', 'content']
        },
        {
          model: node,
          where: { id: { [Op.not]: nodeId } },
          required: false,
          as: 'associated',
          attributes: ['id', 'type', 'name', 'content']
        }
      ]
    });
    // send response
    res.status(200).json({ associations: result, totalItems: totalItems });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

// exports.addToCollection = async (req, res, next) => {
//   // this comes from the is-auth middleware
//   var userId = req.user.uid;
//   try {
//     // catch validation errors
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       const error = new Error('Validation Failed');
//       error.statusCode = 422;
//       error.data = errors.array();
//       throw error;
//     }
//     // process request
//     const nodeId = req.body.nodeId;
//     const collectionId = req.body.collectionId;
//     // add association
//     const result = association.create({
//       nodeId: collectionId,
//       linkedNode: nodeId,
//       creator: userId
//     });
//     // send response
//     res.status(200).json({ collection: result });
//   } catch (err) {
//     if (!err.statusCode) {
//       err.statusCode = 500;
//     }
//     next(err);
//   }
// };

// exports.getAssociatedCollections = async (req, res, next) => {
//   console.log('get associated collections');
//   try {
//     // catch validation errors
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       const error = new Error('Validation Failed');
//       error.statusCode = 422;
//       error.data = errors.array();
//       throw error;
//     }
//     // process request
//     const id = req.query.id;
//     // const type = req.query.type;
//     // load associations
//     const result = await association.findAll({
//       where: {
//         [Op.or]: [{ linkedNode: id }, { nodeId: id }]
//       },
//       attributes: ['nodeId', 'name', 'linkedNode', 'linkStrength', 'creator'],
//       include: [{ model: node, attributes: attributes }]
//     });
//     console.log(result);
//     if (!result) {
//       const error = new Error('Could not find associations');
//       error.statusCode = 404;
//       throw error;
//     }
//     // send response
//     res.status(200).json({ associations: result });
//   } catch (err) {
//     if (!err.statusCode) {
//       err.statusCode = 500;
//     }
//     next(err);
//   }
// };
