const fs = require('fs');
// custom code
const { validationResult } = require('express-validator/check');
// bring in data models.
const { node, association, user } = require('../db/models');
const { Op } = require('sequelize');
// bring in libraries for file and directory name generation
const crypto = require('crypto');
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
        preview: 'data/' + userId + '/exports/' + exportName,
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
      order: [['updatedAt', 'DESC']],
      // limit: 30,
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
        // {
        //   model: association,
        //   where: { creator: userId },
        //   required: false,
        //   as: 'associated',
        //   attributes: [
        //     'id',
        //     'nodeId',
        //     'nodeUUID',
        //     'nodeType',
        //     'linkedNode',
        //     'linkedNodeUUID',
        //     'linkedNodeType',
        //     'linkStrength',
        //     'updatedAt',
        //     'createdAt',
        //   ],
        // },
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
          let extension = node.preview.substr(node.preview.lastIndexOf('.'));
          // append the associated file to the export
          archive.append(fs.createReadStream(node.preview), { name: node.uuid + extension });
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
    // generate user data directory if it does not exist
    if (!fs.existsSync(__basedir + '/data/' + userId)) {
      fs.mkdirSync(__basedir + '/data/' + userId);
    }
    // uuid of the import package node
    const packageUUID = req.body.uuid;
    // fetch the package node from the DB
    const packageNode = await node.findOne({
      where: { [Op.and]: [{ uuid: packageUUID }, { creator: userId }] },
      raw: true,
    });
    // get the fileUrl
    const packageUrl = packageNode.preview;
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
    // loop through the zip entries and create nodes for them
    for (let entry of zipEntries) {
      // loop through the nodes.json file
      if (entry.name === 'nodes.json') {
        // set up main variables for processing
        let jsonData = JSON.parse(entry.getData());
        let newNode = {};
        let newNodeIdList = [];
        // iterate through the JSON data
        for (let nodeImport of jsonData) {
          // if it's not a file just generate the node
          if (!nodeImport.isFile) {
            // generate node
            newNode = await node.create({
              isFile: nodeImport.isFile,
              // hidden: nodeImport.hidden,
              hidden: false,
              // searchable: nodeImport.searchable,
              searchable: true,
              type: nodeImport.type,
              name: nodeImport.name,
              preview: nodeImport.preview,
              content: nodeImport.content,
              creator: userId,
              createdAt: nodeImport.createdAt,
              importId: packageUUID,
            });
          } else {
            // load the fileEntry
            let extension = nodeImport.preview.substr(nodeImport.preview.lastIndexOf('.'));
            // use the uuid to recognize the file
            const fileEntry = zip.getEntry(nodeImport.uuid + extension);
            // create a hash of the filename
            const nameHash = crypto.createHash('md5').update(fileEntry.name).digest('hex');
            // generate directories
            if (
              !fs.existsSync(
                __basedir +
                  '/data/' +
                  userId +
                  '/' +
                  nameHash.substring(0, 3) +
                  '/' +
                  nameHash.substring(3, 6)
              )
            ) {
              // if new directories are needed generate them
              fs.mkdirSync(__basedir + '/data/' + userId + '/' + nameHash.substring(0, 3));
              fs.mkdirSync(
                __basedir +
                  '/data/' +
                  userId +
                  '/' +
                  nameHash.substring(0, 3) +
                  '/' +
                  nameHash.substring(3, 6)
              );
            }
            //extract file to the generated directory
            zip.extractEntryTo(
              fileEntry,
              __basedir +
                '/data/' +
                userId +
                '/' +
                nameHash.substring(0, 3) +
                '/' +
                nameHash.substring(3, 6) +
                '/',
              false,
              true
            );
            // generate node
            newNode = await node.create({
              isFile: nodeImport.isFile,
              // hidden: nodeImport.hidden,
              hidden: false,
              // searchable: nodeImport.searchable,
              searchable: true,
              type: nodeImport.type,
              name: nodeImport.name,
              preview:
                'data/' +
                userId +
                '/' +
                nameHash.substring(0, 3) +
                '/' +
                nameHash.substring(3, 6) +
                '/' +
                fileEntry.name,
              content: nodeImport.content,
              creator: userId,
              createdAt: nodeImport.createdAt,
              importId: packageUUID,
            });
          }
          // if the node in question has associations, process them
          if (nodeImport.associationList) {
            // loop through the associationList for the current node from the JSON file
            for (associationImport of nodeImport.associationList) {
              // create the association as-it-appears, but set the
              // nodeId and nodeUUID to the new values. linkedNode
              // and linkedNodeUUID will temporarily have the wrong values. this will
              // be corrected at a second pass later in the import
              await association.create({
                nodeId: newNode.id,
                nodeUUID: newNode.uuid,
                nodeType: newNode.type,
                linkedNode: associationImport.linkedNode,
                linkedNodeUUID: associationImport.linkedNodeUUID,
                linkedNodeType: associationImport.linkedNodeType,
                linkStrength: associationImport.linkStrength,
                creator: userId,
                importId: packageUUID,
                createdAt: associationImport.createdAt,
                updatedAt: associationImport.updatedAt,
              });
            }
          }
          // store the old and new UUIDs and IDs here to be
          // re-processed in the final passthrough
          newNodeIdList.push({
            oldId: nodeImport.id,
            oldUUID: nodeImport.uuid,
            newId: newNode.id,
            newUUID: newNode.uuid,
          });
        }
        // process the linkedNode and linkedNodeUUID columns
        for (let value of newNodeIdList) {
          // replace the temporary values with the correct values
          association.update(
            {
              linkedNode: value.newId,
              linkedNodeUUID: value.newUUID,
            },
            {
              where: {
                [Op.and]: [
                  { linkedNode: value.oldId },
                  { linkedNodeUUID: value.oldUUID },
                  { importId: packageUUID },
                ],
              },
            }
          );
        }
      } else if (entry.name === 'user.json') {
        console.log('user');
      }
      // console.log(entry.name);
    }

    // mark the import package as expanded
    // node.update(
    //   {
    //     content: { expanded: true },
    //   },
    //   {
    //     where: {
    //       uuid: packageUUID,
    //     },
    //   }
    // );
    // TODO

    // await processZip;
    // await Promise.all([processZip]);
    console.log('done');
    // send response
    res.sendStatus(200);
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
