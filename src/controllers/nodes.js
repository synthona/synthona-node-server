const path = require('path');
var fs = require('fs');
// custom code
const { validationResult } = require('express-validator/check');
const context = require('../util/context');
// bring in data models.
const { node } = require('../db/models');
const { Op } = require('sequelize');

exports.createNode = async (req, res, next) => {
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
    const type = req.body.type;
    const name = req.body.name;
    const local = req.body.local;
    const summary = req.body.summary;
    const content = req.body.content;
    // userId comes from the is-auth middleware
    const userId = req.user.uid;
    // create node
    const result = await node.create({
      local: local,
      type: type,
      name: name,
      summary: summary,
      content: content,
      creator: userId,
    });
    // remove values that don't need to be returned
    delete result.dataValues.local;
    delete result.dataValues.color;
    delete result.dataValues.impressions;
    delete result.dataValues.views;
    delete result.dataValues.createdFrom;
    // send response
    res.status(200).json({ node: result });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getNodeById = async (req, res, next) => {
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
    const id = req.query.id;
    // load node
    const result = await node.findOne({
      where: {
        id: id,
      },
      attributes: ['id', 'local', 'type', 'name', 'summary', 'content', 'updatedAt'],
    });
    if (!result) {
      const error = new Error('Could not find  node');
      error.statusCode = 404;
      throw error;
    }
    context.markNodeView(result.id);
    // update image url
    if (result.type === 'image' && result.local) {
      result.summary = result.summary
        ? req.protocol + '://' + req.get('host') + '/' + result.summary
        : null;
    }
    // send response
    res.status(200).json({ node: result });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.markNodeView = async (req, res, next) => {
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
    const id = req.body.id;
    context.markNodeView(id);
    // send response
    res.sendStatus(200);
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.updateNode = async (req, res, next) => {
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
    const id = req.body.id;
    // load text node
    const existingNode = await node.findOne({
      where: {
        id: id,
      },
    });
    if (!existingNode) {
      const error = new Error('Could not find node');
      error.statusCode = 404;
      throw error;
    }
    // update any values that have been changed
    existingNode.name = req.body.name ? req.body.name : existingNode.name;
    existingNode.summary = req.body.summary ? req.body.summary : existingNode.summary;
    existingNode.content = req.body.content ? req.body.content : existingNode.content;
    // save and store result
    const result = await existingNode.save();
    // return result
    res.status(200).json({ node: result });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.searchNodes = async (req, res, next) => {
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
    var perPage = 15;
    var type = req.query.type || null;
    var searchQuery = req.query.searchQuery || '';

    // create WHERE statement
    var whereStatement = {};
    if (type) whereStatement.type = type;
    if (searchQuery) {
      whereStatement[Op.or] = [
        {
          name: { [Op.iLike]: '%' + searchQuery + '%' },
        },
        {
          summary: { [Op.iLike]: '%' + searchQuery + '%' },
        },
        {
          content: { [Op.iLike]: '%' + searchQuery + '%' },
        },
      ];
    }
    whereStatement.creator = userId;

    // get the total node count
    const data = await node.findAndCountAll({
      where: whereStatement,
    });
    // retrieve nodes for the requested page
    const totalItems = data.count;
    const result = await node.findAll({
      where: whereStatement,
      offset: (currentPage - 1) * perPage,
      limit: perPage,
      order: [['updatedAt', 'DESC']],
      attributes: ['id', 'local', 'name', 'type', 'summary', 'updatedAt'],
      raw: true,
    });
    // TODO!!!! re-apply the base of the image URL (this shouldn't be here lmao. this is only text nodes)
    // i got way ahead of myself refactoring today and basically created a huge mess
    const results = result.map((item) => {
      if (item.type === 'image' && item.local) {
        const fullUrl = item.summary
          ? req.protocol + '://' + req.get('host') + '/' + item.summary
          : null;
        item.summary = fullUrl;
      }
      return item;
    });
    // send response
    res.status(200).json({ nodes: results, totalItems: totalItems });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

// delete a single node and any associations
exports.deleteNodeById = async (req, res, next) => {
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
    const id = req.query.id;
    // load text node
    const nodeToDelete = await node.findOne({
      where: {
        id: id,
      },
    });
    if (!nodeToDelete) {
      const error = new Error('Could not find node');
      error.statusCode = 404;
      throw error;
    }
    // if the node is an image and local, delete from the file system
    if (nodeToDelete.local && nodeToDelete.type === 'image') {
      var filePath = path.join(__basedir, nodeToDelete.summary);
      // remove the file if it exists
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    // delete associations
    context.deleteAssociations(nodeToDelete.id);
    // delete node and send response
    nodeToDelete.destroy();
    res.sendStatus(200);
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
