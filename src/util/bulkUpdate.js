const { node, association } = require('../db/models');

exports.regenerateAssociationTypes = async () => {
  const result = await association.findAll({
    where: {},
    include: [
      {
        model: node,
        as: 'original',
        attributes: ['id', 'local', 'type', 'summary', 'name'],
      },
      {
        model: node,
        as: 'associated',
        attributes: ['id', 'local', 'type', 'summary', 'name'],
      },
    ],
  });
  result.forEach((value) => {
    console.log('\n');
    console.log('id: ' + value.id);
    console.log('original type: ' + value.original.type);
    console.log('associated type: ' + value.associated.type);
    var nodeType = value.original.type;
    var linkedNodeType = value.associated.type;
    association.update(
      {
        nodeType: nodeType,
        linkedNodeType: linkedNodeType,
      },
      { where: { id: value.id } }
    );
  });
  console.log('\n');
  console.log('done');
  return;
};
