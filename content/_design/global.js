module.exports = {
  _id: "_design/global",
  _rev: "force",
  validate_doc_update: function (newDoc, oldDoc, userCtx, secObj) {
    if (userCtx.roles.indexOf("_admin") == -1) {
      throw { unauthorized: "Only admin can edit this database" };
    }

    if (newDoc._deleted) {
      return;
    }

    if (!newDoc.type) {
      throw { forbidden: "Document must have a type" };
    }
  },
};
