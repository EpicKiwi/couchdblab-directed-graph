const PouchDB = require("pouchdb");
const settings = require("./settings.js");

const db = new PouchDB(settings.DATABASE);

async function flushData() {
  let dbInfo = await db.info();

  console.info(`Flushing data to ${dbInfo.host}`);
  console.info("");
}

flushData();
