import axios from "axios";
import fs from "fs/promises";
import slugify from "slugify";
import path from "path";

const CHARACTERS_SOURCE =
  "https://raw.githubusercontent.com/joakimskoog/AnApiOfIceAndFire/master/data/characters.json";
const CHARACTERS_CACHE_FILE = "./got-characters-cache.json";

const HOUSES_SOURCE =
  "https://raw.githubusercontent.com/joakimskoog/AnApiOfIceAndFire/master/data/houses.json";
const houses_CACHE_FILE = "./got-houses-cache.json";

const OUTPUT_FOLDER = "./content/got";

let docs = [];

async function getData() {
  await fs.mkdir(OUTPUT_FOLDER, { recursive: true });

  let charactersJson = await getFileOrCache(
    CHARACTERS_SOURCE,
    CHARACTERS_CACHE_FILE
  );
  let housesJson = await getFileOrCache(HOUSES_SOURCE, houses_CACHE_FILE);

  let validCharacters = charactersJson.filter((el) => !!el.Name);

  let characters = validCharacters.reduce((acc, el) => {
    return { ...acc, [el.Id]: el };
  }, {});

  let charactersDocs = Object.values(characters).reduce((acc, el) => {
    let id = `node-${slugify(el.Name.toLowerCase())}-${el.Id}`;

    let doc = {
      _id: id,
      type: "node",
      nodeType: "character",
      name: el.Name,
      gender: el.IsFemale ? "female" : "male",
      culture: el.Culture ? el.Culture : undefined,
      born: el.Born ? el.Born : undefined,
      died: el.Died ? el.Died : undefined,
      title: el.Titles ? el.Titles : undefined,
      aliases: el.Aliases ? el.Aliases : undefined,
    };

    docs.push(doc);

    return { ...acc, [el.Id]: doc };
  }, {});

  Object.values(characters).forEach((el) => {
    if (!charactersDocs[el.Id]) {
      console.log("Not found character id " + el.Id);
    }

    let characterId = charactersDocs[el.Id]._id;

    if (el.Father && charactersDocs[el.Father]) {
      let fatherId = charactersDocs[el.Father]._id;
      docs.push(makeRelation(characterId, fatherId, "father"));
    }

    if (el.Mother && charactersDocs[el.Mother]) {
      let motherId = charactersDocs[el.Mother]._id;
      docs.push(makeRelation(characterId, motherId, "mother"));
    }

    if (el.Spouse && charactersDocs[el.Spouse]) {
      let spouseId = charactersDocs[el.Spouse]._id;
      docs.push(makeRelation(characterId, spouseId, "spouse"));
    }

    el.Children.forEach((child) => {
      if (!charactersDocs[child]) return;
      let childId = charactersDocs[child]._id;
      docs.push(makeRelation(characterId, childId, "children"));
    });
  });

  let housesDocs = Object.values(housesJson).reduce((acc, el) => {
    let id = `node-${slugify(el.Name.toLowerCase())}-${el.Id}`;

    let doc = {
      _id: id,
      type: "node",
      nodeType: "house",
      name: el.Name,
      region: el.Region ? el.Region : undefined,
      founded: el.Founded ? el.Founded : undefined,
      seats: el.Seats,
      coatOfArms: el.CoatOfArms ? el.CoatOfArms : undefined,
      words: el.Words ? el.Words : undefined,
      titles: el.Titles,
      diedOut: el.DiedOut ? el.DiedOut : undefined,
    };

    docs.push(doc);

    if (el.CurrentLord && charactersDocs[el.CurrentLord]) {
      let lordId = charactersDocs[el.CurrentLord]._id;
      docs.push(makeRelation(id, lordId, "lord"));
    }

    if (el.Founder && charactersDocs[el.Founder]) {
      let founderId = charactersDocs[el.Founder]._id;
      docs.push(makeRelation(id, founderId, "founder"));
    }

    if (el.Heir && charactersDocs[el.Heir]) {
      let heirId = charactersDocs[el.Heir]._id;
      docs.push(makeRelation(id, heirId, "heir"));
    }

    if (el.Overlord && charactersDocs[el.Overlord]) {
      let lordId = charactersDocs[el.Overlord]._id;
      docs.push(makeRelation(id, lordId, "overlord"));
    }

    return { ...acc, [el.Id]: doc };
  }, {});

  Object.values(housesJson).forEach((el) => {
    if (!housesDocs[el.Id]) {
      console.log("Not found house id " + el.Id);
    }
    let houseId = housesDocs[el.Id]._id;

    el.CadetBranches.forEach((branch) => {
      if (!housesDocs[branch]) return;
      let cadetId = housesDocs[branch]._id;
      docs.push(makeRelation(houseId, cadetId, "cadet-branch"));
    });
  });

  Object.values(characters).forEach((el) => {
    if (!charactersDocs[el.Id]) {
      console.log("Not found character id " + el.Id);
    }
    let characterId = charactersDocs[el.Id]._id;

    el.Allegiances.forEach((allegiance) => {
      if (!housesDocs[allegiance]) return;
      let houseId = housesDocs[allegiance]._id;
      docs.push(makeRelation(characterId, houseId, "allegiance"));
    });
  });

  await Promise.all(docs.map((el) => writeDoc(el)));
}

function makeRelation(sourceId, targetId, type) {
  return {
    _id: `relation-${type}-${sourceId.replace("node-", "")}-${targetId.replace(
      "node-",
      ""
    )}`,
    type: "relation",
    relationType: type,
    source: sourceId,
    target: targetId,
  };
}

function writeDoc(doc) {
  console.log(doc._id);
  return fs.writeFile(
    path.join(OUTPUT_FOLDER, `${doc._id}.js`),
    `export default ${JSON.stringify(doc, null, 4)}`
  );
}

async function getFileOrCache(url, cacheFile) {
  let result = null;
  try {
    result = JSON.parse(await fs.readFile(cacheFile, "utf8"));
    console.log("Data loaded using cache " + cacheFile);
  } catch (e) {
    if (e.code != "ENOENT") {
      throw e;
    }
  }

  if (!result) {
    let res = await axios.get(url);

    await fs.writeFile(cacheFile, JSON.stringify(res.data, null, 4));
    console.log("Data loaded using remote " + url);
    result = res.data;
  }
  return result;
}

getData();
