module.exports = {
  _id: "_design/relation",
  _rev: "force",
  validate_doc_update: function (newDoc, oldDoc, userCtx, secObj) {
    if (newDoc._deleted) {
      return;
    }

    if (newDoc.type != "relation") {
      return;
    }

    if (!newDoc.relationType) {
      throw {
        forbidden:
          'Relation should have a "relationType" field describing it\'s type of relation',
      };
    }

    if (!newDoc.source) {
      throw {
        forbidden:
          'Relation should have a "source" field with id of source node',
      };
    }

    if (!newDoc.target) {
      throw {
        forbidden:
          'Relation should have a "source" field with id of target node',
      };
    }
  },
  views: {
    all: {
      map: function (doc) {
        if (doc.type == "relation") {
          emit(doc._id);
        }
      },
    },
    count: {
      map: function (doc) {
        if (doc.type == "relation") {
          emit(doc._id);
        }
      },
      reduce: "_count",
    },
    types: {
      map: function (doc) {
        if (doc.type == "relation") {
          emit(doc.relationType, doc._id);
        }
      },
      reduce: "_count",
    },
    nodeRelations: {
      map: function (doc) {
        if (doc.type == "relation") {
          emit([doc.source, ">", doc.target], {
            _id: doc.target,
            relation: doc,
          });
          emit([doc.target, "<", doc.source], {
            _id: doc.source,
            relation: doc,
          });
        }
      },
    },
    nodeTypedRelations: {
      map: function (doc) {
        if (doc.type == "relation") {
          emit([doc.relationType, doc.source, ">", doc.target], {
            _id: doc.target,
            relation: doc,
          });
          emit([doc.relationType, doc.target, "<", doc.source], {
            _id: doc.source,
            relation: doc,
          });
        }
      },
    },
  },
};
