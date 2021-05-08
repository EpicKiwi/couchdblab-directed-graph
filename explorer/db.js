import "./lib/pouchdb-7.2.1.min.js";
import { DATABASE } from "../settings.js";

export const db = new PouchDB(DATABASE);
export default db;

export async function getRandomNodes(amount = 5) {
  let res = await db.query("node/random", {
    include_docs: true,
    startkey: Math.random(),
    limit: amount,
  });

  let docs = res.rows.map((el) => el.doc);

  return docs;
}

export async function getOutputRelations(nodeId) {
  let res = await db.query("relation/nodeRelations", {
    include_docs: true,
    startkey: [nodeId, ">"],
    endkey: [nodeId, ">", {}],
  });

  let result = res.rows.map((el) => ({
    relation: el.value.relation,
    node: el.doc,
  }));

  return result;
}

const COLOR_PALETTE = [
  "244,67,54",
  "233,30,99",
  "156,39,176",
  "103,58,183",
  "63,81,181",
  "33,150,243",
  "3,169,244",
  "0,188,212",
  "0,150,136",
  "76,175,80",
  "205,220,57",
  "255,235,59",
  "255,152,0",
  "139,195,74",
  "255,193,7",
  "255,87,34",
  "121,85,72",
  "96,125,139",
];

let CACHED_TYPES = null;

export async function getTypes() {
  if (CACHED_TYPES) {
    return CACHED_TYPES;
  }

  let res = await db.query("node/types", {
    group: true,
  });
  let types = res.rows.map((el) => el.key);

  let typeDocs = types.reduce((acc, el, i) => {
    let color = COLOR_PALETTE[i];
    let doc = {
      name: el,
      color: `${color}`,
    };

    return { ...acc, [el]: doc };
  }, {});

  CACHED_TYPES = typeDocs;

  return typeDocs;
}
