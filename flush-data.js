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

  let skippedDocs = [];

  for (let doc of docs) {
    let currentDoc = null;

    try {
      currentDoc = await db.get(doc._id);
    } catch (e) {
      if (e.status != 404) {
        throw e;
      }
    }

    if (!currentDoc) {
      console.info(doc._id);

      delete doc._rev;
      await db.put(doc);

      console.log(`> Created`);
      console.info("");
    } else if (currentDoc && doc._rev) {
      console.info(doc._id);

      doc._rev = currentDoc._rev;
      await db.put(doc);

      console.log(`> Updated`);
      console.info("");
    } else {
      skippedDocs.push(doc._id);
      //console.log(`> Skipped`);
    }
  }

  if (skippedDocs.length > 0) {
    console.log(`Skipped ${skippedDocs.length} docs`);
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
