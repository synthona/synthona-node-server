const fs = require('fs');
// custom code
const { validationResult } = require('express-validator/check');
// bring in data models.
const { node, association, user } = require('../db/models');

// generate a data export for this user
exports.exportAllUserData = async (req, res, next) => {
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
    // set up archiver
    var archiver = require('archiver');
    // create a file to stream archive data to.
    var output = fs.createWriteStream(__basedir + '/port/export.synth.zip');
    var archive = archiver('zip', {
      zlib: { level: 9 }, // Sets the compression level.
    });

    // listen for all archive data to be written
    // 'close' event is fired only when a file descriptor is involved
    output.on('close', function () {
      console.log(archive.pointer() + ' total bytes');
      console.log('archiver has been finalized and the output file descriptor has closed.');
      res.sendStatus(200);
    });

    // This event is fired when the data source is drained no matter what was the data source.
    output.on('end', function () {
      console.log('Data has been drained');
    });

    // good practice to catch warnings (ie stat failures and other non-blocking errors)
    archive.on('warning', function (err) {
      if (err.code === 'ENOENT') {
        // log warning
      } else {
        // throw error
        throw err;
      }
    });

    // good practice to catch this error explicitly
    archive.on('error', function (err) {
      throw err;
    });

    // load in the node export-data from the database
    const nodeData = await node.findAll({
      where: {
        creator: userId,
      },
      raw: true,
    });
    // stringify JSON
    const nodeString = JSON.stringify(nodeData);
    // append a file containing the nodeData
    archive.append(nodeString, { name: 'nodes.json' });

    // load in the association export-data from the database
    const associationData = await association.findAll({
      where: {
        creator: userId,
      },
      raw: true,
    });
    // stringify JSON
    const associationString = JSON.stringify(associationData);
    // append a file containing the associationData
    archive.append(associationString, { name: 'associations.json' });

    // load in the user export-data from the database
    const userData = await user.findAll({
      where: {
        id: userId,
      },
      raw: true,
    });
    // stringify JSON
    const userString = JSON.stringify(userData);
    // append a file containing the userData
    archive.append(userString, { name: 'user.json' });

    // append the filedata for the signed-in user
    archive.directory(__basedir + '/data/' + userId, 'data');

    // pipe archive data to the file
    archive.pipe(output);

    // finalize the archive (ie we are done appending files but streams have to finish yet)
    // 'close', 'end' or 'finish' may be fired right after calling this method so register to them beforehand
    archive.finalize();
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getExportByUUID = async (req, res, next) => {
  try {
    console.log('get export by id');
    // catch validation errors
    // const errors = validationResult(req);
    // if (!errors.isEmpty()) {
    //   const error = new Error('Validation Failed');
    //   error.statusCode = 422;
    //   error.data = errors.array();
    //   throw error;
    // }
    // load all the nodes

    const data = await node.findAll({
      where: {
        id: 2,
      },
    });
    const dataString = JSON.stringify(data);

    const portDir = __basedir + '/port/';
    // const fileName = 'test.json';
    const fileName = 'MississippiSmith.pdf';
    const filePath = portDir + fileName;

    fs.readFile(filePath, (err, data) => {
      if (err) {
        return next(err);
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="' + fileName + '"');
        // res.send(data);
        res.status(200).json({ url: req.protocol + '://' + req.get('host') + '/port/' + fileName });
        console.log('read the file');
      }
    });
    // 2) when it's done generating the file it should send it back to the frontend. maybe via a callback or something
    // await fs.writeFileSync(__basedir + '/port/test.json', result);

    // if (!result) {
    //   const error = new Error('Could not find  node');
    //   error.statusCode = 404;
    //   throw error;
    // }
    // const fileName = 'test';
    // send response
    // res.status(200).download(__basedir + '/port/test.json');
    // res.setHeader('Content-Type', 'application/json');
    // res.setHeader('Content-Disposition', 'attachment; filename="' + fileName + '"');
    // res.status(200).json({ url: req.protocol + '://' + req.get('host') + '/port/' + fileName });
    // res.sendStatus(200);
    // console.log('this is where u would delete the generated file');
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
