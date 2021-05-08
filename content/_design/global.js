export default {
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

    const ALLOWED_TYPES = ["node", "relation"];

    if (ALLOWED_TYPES.indexOf(newDoc.type) == -1) {
      throw {
        forbidden: `Unknown type "${
          newDoc.type
        }", must be one of ${ALLOWED_TYPES.join(", ")}`,
      };
    }
  },
};
