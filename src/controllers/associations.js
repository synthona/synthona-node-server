const { Op } = require('sequelize');
// custom code
const { validationResult } = require('express-validator/check');
const preview = require('../util/preview');
// bring in data models.
const { node, association } = require('../db/models');

exports.createAssociation = async (req, res, next) => {
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
    const nodeId = req.body.nodeId;
    const linkedNodeId = req.body.linkedNode;
    // prevent self association
    if (nodeId === linkedNodeId) {
      const error = new Error('Cannot associate node to itself');
      error.statusCode = 500;
      throw error;
    }
    // check database to make sure both nodes exist
    const nodeA = await node.findOne({
      where: {
        id: nodeId,
      },
    });
    const nodeB = await node.findOne({
      where: {
        id: linkedNodeId,
      },
    });
    // throw error if either is empty
    if (!nodeA || !nodeB) {
      const error = new Error('Could not find both nodes');
      error.statusCode = 404;
      throw error;
    }
    // check to see if association already exists
    const existingAssociation = await association.findAll({
      where: {
        [Op.and]: [
          { nodeId: { [Op.or]: [nodeA.id, nodeB.id] } },
          { linkedNode: { [Op.or]: [nodeA.id, nodeB.id] } },
        ],
      },
    });
    // handle case where association already exists
    if (existingAssociation.length) {
      const error = new Error('Association already exists');
      error.statusCode = 500;
      throw error;
    }
    // create association
    const newAssociation = await association.create({
      nodeId: nodeA.id,
      nodeType: nodeA.type,
      linkedNode: nodeB.id,
      linkedNodeType: nodeB.type,
      linkStrength: 1,
      creator: userId,
    });
    // load new association with node info for the linked node
    const result = await association.findOne({
      where: {
        nodeId: nodeId,
        linkedNode: linkedNodeId,
      },
      attributes: ['id', 'nodeId'],
      include: [
        {
          model: node,
          as: 'associated',
          where: {
            id: newAssociation.linkedNode,
          },
          attributes: ['id', 'local', 'type', 'summary', 'name'],
        },
      ],
    });
    // re-apply baseURL if the type is image
    if (result.associated.type === 'image' && result.associated.local) {
      const fullUrl = result.associated.summary
        ? req.protocol + '://' + req.get('host') + '/' + result.associated.summary
        : null;
      result.associated.summary = fullUrl;
    }
    // send response with values
    res.status(200).json({ association: result });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

// get values for autocompleting the add association search bar
exports.associationAutocomplete = async (req, res, next) => {
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
    // store request variables
    var resultLimit = 7;
    var searchQuery = req.query.searchQuery || '';
    var nodeId = parseInt(req.query.nodeId);
    // make a request to association table to get list of nodes to exclude
    const exclusionValues = await association.findAll({
      where: {
        [Op.or]: {
          nodeId: nodeId,
          linkedNode: nodeId,
        },
      },
      attributes: ['id', 'nodeId', 'linkedNode'],
      raw: true,
    });
    // create exclusionList to prevent re-association
    var exclusionList = [];
    exclusionValues.map((value) => {
      if (!exclusionList.includes(value.nodeId)) {
        exclusionList.push(value.nodeId);
      }
      if (!exclusionList.includes(value.linkedNode)) {
        exclusionList.push(value.linkedNode);
      }
      return;
    });
    // prevent self-association
    if (!exclusionList.includes(nodeId)) {
      exclusionList.push(nodeId);
    }
    // create WHERE statement for request to node table
    var whereStatement = {};
    var orderStatement = [];
    // set searchQuery
    if (searchQuery) {
      whereStatement[Op.and] = [
        // look for text match for the name
        {
          name: { [Op.iLike]: '%' + searchQuery + '%' },
        },
        // prevent association with exclusionList
        {
          id: { [Op.not]: exclusionList },
        },
      ];
      orderStatement = [['name', 'ASC']];
    } else {
      // prevent association with exclusionList
      whereStatement = [
        {
          id: { [Op.not]: exclusionList },
        },
      ];
      // if there is no search query, provide
      // the most recent nodes by default
      orderStatement = [['updatedAt', 'DESC']];
    }
    // limit results to those created by yourself????
    // TODO: revisit this and think about how it works on multiuser server
    whereStatement.creator = userId;
    // retrieve nodes for the requested page
    const result = await node.findAll({
      where: whereStatement,
      limit: resultLimit,
      order: orderStatement,
      attributes: ['id', 'name'],
    });
    // send response
    res.status(200).json({ nodes: result });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

// get associations for a given node
exports.getAssociations = async (req, res, next) => {
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
    var perPage = 12;
    // get the total node count
    const data = await association.findAndCountAll({
      where: {
        creator: userId,
        [Op.or]: [{ nodeId: nodeId }, { linkedNode: nodeId }],
      },
    });
    // retrieve nodes for the requested page
    const totalItems = data.count;
    const result = await association.findAll({
      where: {
        creator: userId,
        [Op.or]: [{ nodeId: nodeId }, { linkedNode: nodeId }],
      },
      offset: (currentPage - 1) * perPage,
      limit: perPage,
      //TODO: sort by linkStrength once that is working?
      order: [['updatedAt', 'DESC']],
      attributes: [
        'id',
        'nodeId',
        'nodeType',
        'linkedNode',
        'linkedNodeType',
        'linkStrength',
        'updatedAt',
      ],
      // include whichever node is the associated one for
      include: [
        {
          model: node,
          where: { id: { [Op.not]: nodeId } },
          required: false,
          as: 'original',
          attributes: ['id', 'local', 'type', 'summary', 'name'],
        },
        {
          model: node,
          where: { id: { [Op.not]: nodeId } },
          required: false,
          as: 'associated',
          attributes: ['id', 'local', 'type', 'summary', 'name'],
        },
      ],
    });

    var associations = [];
    // condense results to one list
    result.forEach((association) => {
      if (association.original !== null) {
        associations.push(association.original);
      } else if (association.associated !== null) {
        associations.push(association.associated);
      }
    });
    // TODO!!!! re-apply the base of the image URL (this shouldn't be here lmao. this is only text nodes)
    // i got way ahead of myself refactoring today and basically created a huge mess
    const results = associations.map((item) => {
      if (item.type === 'image' && item.local) {
        const fullUrl = item.summary
          ? req.protocol + '://' + req.get('host') + '/' + item.summary
          : null;
        item.summary = fullUrl;
      }
      return item;
    });
    // send response
    res.status(200).json({ associations: results, totalItems: totalItems });
    next();
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.deleteAssociation = async (req, res, next) => {
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
    // store variables from request
    const nodeA = req.query.nodeA;
    const nodeB = req.query.nodeB;
    // find the association in question
    const result = await association.findOne({
      where: {
        creator: userId,
        [Op.and]: [
          { nodeId: { [Op.or]: [nodeA, nodeB] } },
          { linkedNode: { [Op.or]: [nodeA, nodeB] } },
        ],
      },
      attributes: ['id', 'nodeId', 'nodeType', 'linkedNode', 'linkedNodeType'],
    });
    if (!result) {
      const error = new Error('Could not find association');
      error.statusCode = 404;
      throw error;
    }
    // set deletedId
    var deletedId = nodeB;
    // delete the association from the database
    result.destroy();
    // send response with success message
    res.status(200).json({ message: 'deleted association', deletedId });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
