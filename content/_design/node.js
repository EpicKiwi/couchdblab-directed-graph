export default {
  _id: "_design/node",
  _rev: "force",
  validate_doc_update: function (newDoc, oldDoc, userCtx, secObj) {
    if (newDoc._deleted) {
      return;
    }

    if (newDoc.type != "node") {
      return;
    }

    if (!newDoc.nodeType) {
      throw {
        forbidden:
          'Node should have a "nodeType" field describing it\'s type of node',
      };
    }

    if (!newDoc.name) {
      throw { forbidden: 'Node should have a "name" field' };
    }
  },
  views: {
    all: {
      map: function (doc) {
        if (doc.type == "node") {
          emit(doc._id);
        }
      },
    },
    random: {
      map: function (doc) {
        if (doc.type == "node") {
          emit(Math.random(), doc._id);
        }
      },
    },
    randomType: {
      map: function (doc) {
        if (doc.type == "node") {
          emit([doc.nodeType, Math.random()], doc._id);
        }
      },
    },
    count: {
      map: function (doc) {
        if (doc.type == "node") {
          emit(doc._id);
        }
      },
      reduce: "_count",
    },
    types: {
      map: function (doc) {
        if (doc.type == "node") {
          emit(doc.nodeType, doc._id);
        }
      },
      reduce: "_count",
    },
  },
};
