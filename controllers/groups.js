'use strict';

const ObjectId = require('mongodb').ObjectId;

module.exports.get = (req, res) => {
  const {
    query
  } = req;

  req.app.db.models.Group.find({})
    .then((groups) => {
      const {
        groupName
      } = query;
      const sortedGroups = groups.sort((a, b) => a.name === b.name ? 0 : ((a.name > b.name) ? 1 : -1))

      if (req.xhr) {
        const lowerCasedGroupName = groupName.toLowerCase();

        return res.json({
          groups: sortedGroups.filter(group => group.name.toLowerCase().startsWith(lowerCasedGroupName))
        });
      } else {
        return res.render('groups', {
          title: 'Групи',
          groups: sortedGroups
        });
      }
    });
};

module.exports.update = (req, res) => {
  const {
    body
  } = req;

  req.app.db.models.Group.findOne({
      _id: body.group
    })
    .then((group) => {
      const prevName = group.name;
      const newName = body.name;

      group.name = newName;

      group.save((err, group) => {
        if (err) {
          return res.json({
            err: err,
            name: prevName
          });
        }

        res.send(group);
      });
    });
};

module.exports.create = (req, res) => {
  const {
    body
  } = req;
  const newGroup = req.app.db.models.Group({
    name: body.name.toUpperCase()
  });

  newGroup.save((err, group) => {
    if (err) {
      return res.send(err);
    }

    return res.send(group);
  });
};

module.exports.remove = (req, res) => {
  const {
    body
  } = req;

  req.app.db.models.Group.remove({
    _id: ObjectId(body.group)
  }, (err) => {
    if (err) {
      return res.status(500).send(err);
    }

    return res.sendStatus(200);
  });
};