const fs = require('fs');
// custom code
const { validationResult } = require('express-validator/check');
// bring in data models.
const { node, association, user } = require('../db/models');
const { Op } = require('sequelize');
// set up archiver and unzip library
const archiver = require('archiver');
var admZip = require('adm-zip');

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
    // generate export directory if it does not exist
    if (!fs.existsSync('data/' + userId + '/exports/')) {
      fs.mkdirSync('data/' + userId + '/exports/');
    }
    // set export name and extension
    const exportName = new Date().getTime() + '.synth.zip';
    const exportDest = __basedir + '/data/' + userId + '/exports/' + exportName;
    // create a file to stream archive data to.
    var output = fs.createWriteStream(exportDest);
    var archive = archiver('zip', {
      zlib: { level: 9 }, // Sets the compression level.
    });
    // listen for all archive data to be written
    // 'close' event is fired only when a file descriptor is involved
    output.on('close', async () => {
      console.log(archive.pointer() + ' total bytes');
      console.log('archiver has been finalized and the output file descriptor has closed.');
      // create node when the export is done
      await node.create({
        isFile: true,
        hidden: false,
        searchable: true,
        type: 'synthona',
        name: exportName,
        summary: 'data/' + userId + '/exports/' + exportName,
        content: exportName,
        creator: userId,
      });
      // TODO: send back the created export to the client as a file
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

    // load in the node and association export-data from the database
    const nodeData = await node.findAll({
      where: {
        creator: userId,
        [Op.and]: [{ [Op.not]: { type: 'synthona' } }, { [Op.not]: { type: 'audio' } }],
      },
      order: [['id', 'ASC']],
      // attributes: ['id', 'uuid'],
      // include the associations
      include: [
        {
          model: association,
          where: { creator: userId },
          required: false,
          as: 'original',
          attributes: [
            'id',
            'nodeId',
            'nodeUUID',
            'nodeType',
            'linkedNode',
            'linkedNodeUUID',
            'linkedNodeType',
            'linkStrength',
            'updatedAt',
            'createdAt',
          ],
        },
        {
          model: association,
          where: { creator: userId },
          required: false,
          as: 'associated',
          attributes: [
            'id',
            'nodeId',
            'nodeUUID',
            'nodeType',
            'linkedNode',
            'linkedNodeUUID',
            'linkedNodeType',
            'linkStrength',
            'updatedAt',
            'createdAt',
          ],
        },
      ],
    });
    // loop through all nodes
    let nodeIdList = [];
    let exportJSON = [];
    // clean up and organize data for export
    await nodeData.forEach((node) => {
      // add associated files to the export
      if (!nodeIdList.includes(node.id)) {
        // if the node is a file, add the file to the export
        if (node.isFile) {
          extension = node.summary.substr(node.summary.lastIndexOf('.'));
          // append the associated file to the export
          archive.append(fs.createReadStream(node.summary), { name: node.uuid + extension });
        }
        var associationList = [];
        var exportNode = node;
        // copy the "includes" data into a single location
        if (node.associated) {
          associationList.push(node.associated.dataValues);
          exportNode.dataValues['associationList'] = associationList;
          // clear associated property now that it is not needed
          delete exportNode.associated.dataValues;
        }
        if (node.original) {
          associationList.push(node.original.dataValues);
          exportNode.dataValues['associationList'] = associationList;
          // clear original property now that it is not needed
          delete exportNode.original.dataValues;
        }
        // add the id onto the nodeIdList counter
        nodeIdList.push(node.id);
        // add the node to the exportJSON
        exportJSON.push(exportNode);
      } else {
        // if the node is a duplicate add its associations onto the first occurance of it.
        // since this is a duplicate, we can get the duplicateNode from exportJSON via the nodeIdList index
        // as it has already been stored there, and the nodeIdList index aligns with the exportJSON index
        // since they have both been written to the same amount of times in the same order
        let exportNode = exportJSON[nodeIdList.indexOf(node.id)];
        var associationList = exportNode.dataValues['associationList'] || [];
        // exportNode is the pre-existing node which we are tacking
        // the associations onto since they don't come this way from the DB
        if (exportNode.id === node.id) {
          if (node.associated) {
            associationList.push(node.associated.dataValues);
            exportNode.dataValues['associationList'] = associationList;
          }
          if (node.original) {
            associationList.push(node.original.dataValues);
            exportNode.dataValues['associationList'] = associationList;
          }
        }
      }
    });
    // stringify JSON
    const nodeString = JSON.stringify(exportJSON);
    // append a file containing the nodeData
    archive.append(nodeString, { name: '/db/nodes.json' });
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
    archive.append(userString, { name: '/db/user.json' });
    // pipe archive data to the file
    archive.pipe(output);
    // finalize the archive (ie we are done appending files but streams have to finish yet)
    // 'close', 'end' or 'finish' may be fired right after calling this method so register to them beforehand
    console.log('finalizing');
    archive.finalize();
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.unpackSynthonaImport = async (req, res, next) => {
  try {
    // catch validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error('Validation Failed');
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }
    const uuid = req.body.uuid;
    const packageNode = await node.findOne({ where: { uuid: uuid }, raw: true });
    const packageUrl = packageNode.summary;
    // check zip buffer size before unzipping
    var buffer = new admZip(packageUrl).toBuffer();
    const maxZipSize = 1000000000; // 1GB
    if (buffer.byteLength > maxZipSize) {
      err = new Error('zip buffer exceeds max allowed size');
      err.statusCode = 500;
      throw err;
    }
    // create new reference to zip
    var zip = new admZip(packageUrl);
    var zipEntries = zip.getEntries();
    // const newIds = [];
    // loop through the zip entries and create nodes for them
    zipEntries.forEach((entry) => {
      if (entry.name === 'nodes.json') {
        console.log('node');
        // newIds.push({oldId: entry.id, newId: })
        const jsonData = JSON.parse(entry.getData());
        // console.log(jsonData);
        jsonData.forEach((node) => {
          console.log(node.name);
        });
      } else if (entry.name === 'association.json') {
        console.log('user');
      } else if (entry.name === 'user.json') {
        console.log('user');
      }
      // console.log(entry.name);
    });
    // two passes on import
    // the first is to create the new nodes as empty nodes and get the new IDs/contextIds
    // and use those to recreate the half of the association you can create
    // the second is to write all the data from nodes.json back onto the nodes
    // which is what completes the import process without overwriting existing data!

    // two passes are needed becasue of how exports are built to conserve space
    // without losing any import information

    // at this point i guess i should just uh...iterate through the unzipped directory
    // and use the DB directory to create nodes for everything again?
    // the problem i suppose is, how to make sure the files line up with the nodes?
    // maybe the export should use the uh...uuid...as the name instead
    console.log('done');
    res.sendStatus(200);
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

// exports.getExportByUUID = async (req, res, next) => {
//   try {
//     console.log('get export by id');
//     // catch validation errors
//     // const errors = validationResult(req);
//     // if (!errors.isEmpty()) {
//     //   const error = new Error('Validation Failed');
//     //   error.statusCode = 422;
//     //   error.data = errors.array();
//     //   throw error;
//     // }
//     // load all the nodes

//     const data = await node.findAll({
//       where: {
//         id: 2,
//       },
//     });
//     const dataString = JSON.stringify(data);

//     const portDir = __basedir + '/port/';
//     // const fileName = 'test.json';
//     const fileName = 'MississippiSmith.pdf';
//     const filePath = portDir + fileName;

//     fs.readFile(filePath, (err, data) => {
//       if (err) {
//         return next(err);
//       } else {
//         res.setHeader('Content-Type', 'application/json');
//         res.setHeader('Content-Disposition', 'attachment; filename="' + fileName + '"');
//         // res.send(data);
//         res.status(200).json({ url: req.protocol + '://' + req.get('host') + '/port/' + fileName });
//         console.log('read the file');
//       }
//     });
//     // 2) when it's done generating the file it should send it back to the frontend. maybe via a callback or something
//     // await fs.writeFileSync(__basedir + '/port/test.json', result);

//     // if (!result) {
//     //   const error = new Error('Could not find  node');
//     //   error.statusCode = 404;
//     //   throw error;
//     // }
//     // const fileName = 'test';
//     // send response
//     // res.status(200).download(__basedir + '/port/test.json');
//     // res.setHeader('Content-Type', 'application/json');
//     // res.setHeader('Content-Disposition', 'attachment; filename="' + fileName + '"');
//     // res.status(200).json({ url: req.protocol + '://' + req.get('host') + '/port/' + fileName });
//     // res.sendStatus(200);
//     // console.log('this is where u would delete the generated file');
//   } catch (err) {
//     if (!err.statusCode) {
//       err.statusCode = 500;
//     }
//     next(err);
//   }
// };
