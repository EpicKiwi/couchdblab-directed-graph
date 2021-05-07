const PouchDB = require("pouchdb");
const { promisify } = require("util");
const glob = promisify(require("glob"));
const settings = require("./settings.js");

const db = new PouchDB(settings.DATABASE);

async function flushData() {
  let dbInfo = await db.info();

  console.info(`Flushing data to ${dbInfo.host}`);
  console.info("");

  let sourceFiles = await glob("./content/**/*.js");

  let docs = sourceFiles.map((el) => getDoc(el));

  for (let doc of docs) {
    console.info(doc._id);

    let currentDoc = null;

    try {
      currentDoc = await db.get(doc._id);
    } catch (e) {
      if (e.status != 404) {
        throw e;
      }
    }

    if (!currentDoc) {
      delete doc._rev;
      await db.put(doc);
      console.log(`> Created`);
    } else if (currentDoc && doc._rev) {
      doc._rev = currentDoc._rev;
      await db.put(doc);
      console.log(`> Updated`);
    } else {
      console.log(`> Skipped`);
    }

    console.info("");
  }
}

function getDoc(docJsFile) {
  let doc = require(docJsFile);

  if (!doc._id) {
    throw new Error(`Document ${docJsFile} should have a field _id`);
  }

  doc = convertFunctions(doc);

  return doc;
}

function convertFunctions(doc) {
  let newDoc = { ...doc };

  Object.keys(newDoc).forEach((key) => {
    if (typeof newDoc[key] === "function") {
      newDoc[key] = newDoc[key].toString();
    } else if (typeof newDoc[key] === "object") {
      newDoc[key] = convertFunctions(newDoc[key]);
    }
  });

  return newDoc;
}

flushData().catch((e) => console.error(e));
