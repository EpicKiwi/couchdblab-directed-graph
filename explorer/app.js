import db, { getOutputRelations, getRandomNodes, getTypes } from "./db.js";

const randomNodesContainerEl = document.getElementById(
  "random-nodes-container"
);
const exploreAreaEl = document.getElementById("explore-area");

const compactNodeTemplate = document.getElementById("compact-node-template");
const nodeCardTemplate = document.getElementById("node-card-template");
const relationNodeTemplate = document.getElementById("relation-node-template");
const followedRelationTemplate = document.getElementById(
  "followed-relation-template"
);

async function init() {
  const [startupNodes, nodeTypes] = await Promise.all([
    getRandomNodes(),
    getTypes(),
  ]);

  randomNodesContainerEl.innerHTML = "";
  startupNodes.forEach((nodeDoc) => {
    let type = nodeTypes[nodeDoc.nodeType];
    let el = randomNodesContainerEl.appendChild(
      renderCompactNode(nodeDoc.name, type.color)
    );
    el.addEventListener("click", () => initExploration(nodeDoc._id));
  });
}

function renderCompactNode(name, fromColorType) {
  let content = compactNodeTemplate.content.children[0].cloneNode(true);

  content.querySelector(".node-name").textContent = name;

  content.style.setProperty("--node-color", fromColorType);

  return content;
}

async function initExploration(nodeId) {
  exploreAreaEl.innerHTML = "";
  exploreAreaEl.appendChild(await renderNodeCard(nodeId));
}

async function renderNodeCard(nodeId) {
  const [nodeDoc, types, relations] = await Promise.all([
    db.get(nodeId),
    getTypes(),
    getOutputRelations(nodeId),
  ]);
  let type = types[nodeDoc.nodeType];

  let content = nodeCardTemplate.content.children[0].cloneNode(true);
  content.style.setProperty("--node-color", type.color);

  content.dataset.nodeId = nodeDoc._id;

  content.querySelector(".node-name").textContent = nodeDoc.name;
  content.querySelector(".node-type").textContent = nodeDoc.nodeType;

  let metaEl = content.querySelector(".metadata");

  Object.entries(nodeDoc).forEach(([key, value]) => {
    let keyEl = document.createElement("dt");
    keyEl.textContent = key;
    metaEl.appendChild(keyEl);

    let valueEl = document.createElement("dd");
    valueEl.textContent = value;
    metaEl.appendChild(valueEl);
  });

  let relationEl = content.querySelector(".relations");
  relations.forEach((el) => {
    let nodeType = types[el.node.nodeType];

    let relationContent = relationNodeTemplate.content.children[0].cloneNode(
      true
    );
    relationContent.dataset.relationId = el.relation._id;
    relationContent.dataset.nodeId = el.node._id;

    relationContent.style.setProperty("--node-color", nodeType.color);

    relationContent.querySelector(".relation-name").textContent =
      el.relation.relationType;
    relationContent.querySelector(".node-name").textContent = el.node.name;

    let relationBtn = relationEl.appendChild(relationContent);

    relationBtn.addEventListener("click", handleRelationClick);
  });

  return content;
}

function handleRelationClick(e) {
  let card = this.closest(".node-card");

  if (card !== exploreAreaEl.lastChild) {
    let passed = false;
    for (let el of Array.from(exploreAreaEl.children)) {
      if (el === card) {
        passed = true;
        continue;
      }
      if (passed) {
        exploreAreaEl.removeChild(el);
      }
    }
  }

  if (!this.disabled) {
    followRelation(this.dataset.relationId);
  }
}

async function followRelation(relationId) {
  let currentCard = exploreAreaEl.lastChild;
  Array.from(currentCard.querySelectorAll(".relations button")).forEach(
    (el) => {
      el.classList.toggle("selected", el.dataset.relationId == relationId);
    }
  );

  let relation = await db.get(relationId);

  let relationContent = followedRelationTemplate.content.children[0].cloneNode(
    true
  );
  relationContent.querySelector(".relation-name").textContent =
    relation.relationType;
  exploreAreaEl.appendChild(relationContent);

  let appendCard = exploreAreaEl.appendChild(
    await renderNodeCard(relation.target)
  );

  let cardRect = appendCard.getBoundingClientRect();
  console.log(cardRect);
  window.scrollTo({
    behavior: "smooth",
    top: window.scrollY + cardRect.top - 200,
  });

  console.log("follow relation", relationId);
}

init();
