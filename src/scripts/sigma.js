/**
 * Ian Cunningham 4/21/2026
 * This file is to read all of the data from the JSON files and construct a
 * graph of nodes. The nodes are categorized by topic automatically. The only
 * limitation is if more than 9 topics are created then the coloring will break.
 */

import Graph from "graphology";
import Sigma from "sigma";
import random from "graphology-layout/random";
import forceAtlas2 from "graphology-layout-forceatlas2";
import { ghGetSourceJSONs, ghAddSourceForm } from "./github"
import { getTopicHierarchy } from "./topics"
const topicHierarchy = getTopicHierarchy()

/**
 * This function loads the data from the JSON files. It currently only does this from
 * software.json as that is the only file with usable data at the time of writing. (4/21)
 * @returns graphData
 */
async function loadGraph() {
    //const response = await fetch("/sources/software.json");
    //const graphData = await response.json();
    const graphData = await ghGetSourceJSONs();
    
    // create copies so the originals don't get messed up
    return graphData.map(x => structuredClone(x));
}

let graph_json = await loadGraph();

let graph = new Graph({
    multi: true
});

//this populates the graph with the nodes
for(let i=0;i<graph_json.length;i++) {
    let node = graph_json[i];
    try {
        graph.addNode(node.title, node);
    }
    catch {
        console.log(`Failed to add node.\nTitle: ${node.title}.`)
    }
}

/**
 * This creates the display-container by reading from
 * the topics and creating a div that has a checkbox and
 * label for each. The checkbox toggles the topicVisibility
 * and calls updateVisibility().
 */
const display_container = document.getElementById("display-container");
const section = document.createElement("div");
section.className = "Topics";
section.textContent = "Topics:";
display_container.appendChild(section);


/**
 * All of this is for the "Select All" button so that
 * the user can hide everything and choose what category
 * to search for if they so wish. It currently doesn't
 * work with the filter by year option :(
 */
const topicCheckboxes = [];
const selectAllRow = document.createElement("div");

const selectAllLabel = document.createElement("label");
selectAllLabel.textContent = "Select All";

const selectAllCheckbox = document.createElement("input");
selectAllCheckbox.type = "checkbox";
selectAllCheckbox.checked = true;

selectAllCheckbox.addEventListener("change", (event) => {
    const checked = event.target.checked;

    topicCheckboxes.forEach(cb => {
        cb.checked = checked;
    });

    // update model state
    topics.forEach(topic => {
        topicVisibility[topic] = checked;
    });

    updateVisibility();
});

selectAllRow.appendChild(selectAllLabel);
selectAllRow.appendChild(selectAllCheckbox);
display_container.appendChild(selectAllRow);

/**
 * This reads each of the topics from the JSON and creates an arraylist of them
 * and binds the nodes to that topic
 */

//creates a set of categorized topics from topics.js
const categorizedTopics = new Set();
for(const supertopic in topicHierarchy) {
    for(const topic of topicHierarchy[supertopic]) {
        categorizedTopics.add(topic);
    }
}

//creates a set of topics and document types from nodes
const docTypes = new Set();
const allTopics = new Set();
graph.forEachNode((node, attributes) => {
    const topics = attributes.topics || [];
    const formType = attributes.form || [];

    for(const topic of topics) {
        allTopics.add(topic);
    }
    if(!docTypes.has(formType)) {
        docTypes.add(formType);
    }

});

//puts topics in nodes that aren't in categorized topics into their own set
const uncatergorizedTopics = [];
for(const topic of allTopics) {
    if(!categorizedTopics.has(topic)) {
        uncatergorizedTopics.push(topic);
    }
}

/**
 * This creates the divs for the categorized topics in the
 * display_container based on the set. It also allows you to
 * toggle with the buttons, with the topic checkboxes starting
 * off as hidden.
 */
for(let supertopic in topicHierarchy) {
    let subtopics = topicHierarchy[supertopic]
    // supertopic button

    const subtopic_container = document.createElement("div");
    subtopic_container.className = "subtopic-container"
    subtopic_container.style.display = "none";
    const button = document.createElement("button")
    button.className = "supertopic";
    button.innerText = supertopic;
    button.addEventListener("click", () => {
        subtopic_container.style.display =
            subtopic_container.style.display === "none"
                ? "block"
                : "none";
    });
    display_container.appendChild(button);

    for(let i = 0; i < subtopics.length; i ++) {
        const topic = subtopics[i];
        const row = document.createElement("div");
        row.className = "topic-row";

        const label = document.createElement("label");
        label.textContent = topic;

        //adds button to div
        const topicCheckbox = document.createElement("input");
        topicCheckbox.type = "checkbox";
        topicCheckbox.checked = true;

        topicCheckbox.addEventListener("click", () => {
            topicVisibility[topic] = event.target.checked;
            updateVisibility();
        });
        topicCheckboxes.push(topicCheckbox);

        row.appendChild(label);
        row.appendChild(topicCheckbox);
        subtopic_container.appendChild(row);
    }
    display_container.appendChild(subtopic_container);
}

//does the same as above but for the uncategorized topics
if(uncatergorizedTopics.length > 0) {

    const subtopic_container = document.createElement("div");
    subtopic_container.className = "subtopic-container";
    subtopic_container.style.display = "none";
    const button = document.createElement("button");
    button.className = "supertopic";
    button.innerText = "Uncategorized";
    button.addEventListener("click", () => {
        subtopic_container.style.display =
            subtopic_container.style.display === "none"
                ? "block"
                : "none";
    });
    display_container.appendChild(button);

    for(const topic of uncatergorizedTopics) {
        const row = document.createElement("div");
        row.className = "topic-row";

        const label = document.createElement("label");
        label.textContent = topic;

        const topicCheckbox = document.createElement("input");
        topicCheckbox.type = "checkbox";
        topicCheckbox.checked = true;

        topicCheckbox.addEventListener("click", (event) => {
            topicVisibility[topic] = event.target.checked;
            updateVisibility();
        });
        topicCheckboxes.push(topicCheckbox);
        row.appendChild(label);
        row.appendChild(topicCheckbox);
        subtopic_container.appendChild(row);
    }
    display_container.appendChild(subtopic_container);
}



/**
 * The set colors that can be used for topics
 */
const palette = [
    "#FB2340", "#F8A025", "#1FE9FF",
    "#00EB62", "#0400EB", "#EB00E3",
    "#F5ED00", "#93F500", "#AF00F5",
    "#850404", "#130485", "#2A3616",
    "#FFBDE4", "#B5A000", "#00B579",
    "#8C5023", "#6D827A", "#25520B"
]

//assigns each topic a color
const COLORS = {};
const topics = [...allTopics];
topics.forEach((topic, i) => {
    COLORS[topic] = palette[i % palette.length];
});

topics.push("none");

/**
 * Assigns the nodes their color based on their first topic. If there is
 * no topic then it sets the color to gray. This also makes nodes bigger 
 * based on the number of topics that it includes.
 */
graph.forEachNode((node, attributes) => {
    graph.setNodeAttribute(node, "color", COLORS[attributes.topics[0]] || "gray");
    graph.setNodeAttribute(node, "size", 10);
});

//creates a list of titles for citations
const citations = {};
graph.forEachNode((node, attributes) => {
    if (!citations[attributes.title]) {
        citations[attributes.title] = [];
    }

    citations[attributes.title] = node;
});

//goes through each nodes citations and links them to their citations
graph.forEachNode((node, attributes) => {
    const sources = attributes.cites || [];

    for (const source of sources) {
        const targetNode = citations[source];

        if (targetNode) {
            if (!graph.hasEdge(node, targetNode)) {
                graph.addEdge(node, targetNode, {
                    size: 3,
                    color: "#D6D6D6"
                });
            }
        }
    }
});

//creates topic centers for forceAtlas2
const topicCenters = {};

topics.forEach((topic, i) => {
    const angle = (2 * Math.PI * i) / topics.length;

    topicCenters[topic] = {
        x: Math.cos(angle) * 100,
        y: Math.sin(angle) * 100
    };
});

//assigns nodes to topics
graph.forEachNode((node, attributes) => {
    const nodeTopics = attributes.topics || [];

    if(nodeTopics.length > 0) {
        const center = topicCenters[nodeTopics[0]];

        graph.setNodeAttribute(
            node,
            "x",
            center.x + (Math.random() - 0.05) * 20
        );

        graph.setNodeAttribute(
            node,
            "y",
            center.y + (Math.random() - 0.05) * 20
        );
        
    }
    else {
        graph.setNodeAttribute(node, "x", 0);
        graph.setNodeAttribute(node, "y", 0);
    }
});

/**
 * Organizes the graph based on genre. These are temporary numbers
 * and will change as the dataset increases to allow for a readable graph.
 * There is also the possibility to change to random instead of circular.
 */
const settings = forceAtlas2.inferSettings(graph);
settings.gravity = 0.1;
settings.scalingRatio = 10;
forceAtlas2.assign(graph, { settings, iterations: 100});


//creates renderer
const renderer = new Sigma(graph, document.getElementById("sigma-container"));

//insert snippet container
const snippet_container = document.getElementById("snippet-container");
const sigmaContainer = renderer.getContainer();

sigmaContainer.insertBefore(snippet_container, sigmaContainer.querySelector(".sigma-hovers"));

export { graph, renderer, snippet_container };


//creates a dictionary for the visibility on each topic
const topicVisibility = { "none" : true };
topics.forEach(topic => {
    topicVisibility[topic] = true;
});

//creates dictionary for visibility on each group
const typeVisibility = { "none" : true };
docTypes.forEach(form => {
    typeVisibility[form] = true;
});

//year section header
const year = document.createElement("div");
year.textContent = "Filter By Year:";
display_container.appendChild(year);

//Creates all of the elements for year selection
const yearSelect = document.createElement("div");
yearSelect.classList.add('yearStyle');
const startYear = document.createElement("input");
startYear.type = "text";
const label = document.createElement("label");
label.textContent = "to";
const endYear = document.createElement("input");
endYear.type = "text";
const currentYear = new Date().getFullYear();
endYear.value = currentYear;
const choseYear = document.createElement("input");
choseYear.type = "button";
choseYear.value = "Filter ";


/**
 * Event listener for when the "sort" button is
 * clicked to sort by year. This updates the visibility
 * on all of the nodes on the graph. At this point in time
 * the data must have a date that includes a year and 
 * use a delimiter of foward slashes "/", and it must
 * start with the year "this is how Alan has been webscraping"
 * EX: 2026/5/12
 */
choseYear.addEventListener("click", () => {
    const start = parseInt(startYear.value);
    const end = parseInt(endYear.value);

    //error checks for ints
    if(!start || !end) {
        alert("Invalid input!\nMust be a numerical year");
        return;
    }
    //checks that there is a valid date range
    else if(end < start || start < 0) {
        alert("Invalid input!\nMust be a valid date range");
    }

    graph.forEachNode((node, attributes) => {
        const nodeDate = new Date(attributes.date);
        const nodeYear = nodeDate.getFullYear();
        const visible = nodeYear >= start && nodeYear <= end;
        graph.setNodeAttribute(node, "hidden", !visible);
    });
    renderer.refresh();
});

//append year textboxes to display_container
yearSelect.appendChild(startYear);
yearSelect.appendChild(label);
yearSelect.appendChild(endYear);
yearSelect.appendChild(choseYear);
display_container.appendChild(yearSelect);

//helper function
function isNodeVisible(topics) {
    return topics.some(t => topicVisibility[t]) ||
        (topics.length === 0 && topicVisibility["none"]);
}

//section for filtering by document type
const docType = document.createElement("div");
docType.textContent = "Filter By Type:";
display_container.appendChild(docType);

//checkboxes for each document type
for(const formType of docTypes) {
    const row = document.createElement("div");
    row.className = "formTypeRow";

    //makes first leter uppercase
    const labelText = formType => formType[0].toUpperCase() + formType.slice(1);

    const label = document.createElement("label");
    label.textContent = labelText(formType);

    const formCheckbox = document.createElement("input");
    formCheckbox.type = "checkbox";
    formCheckbox.checked = true;

    formCheckbox.addEventListener("click", (event) => {
        typeVisibility[formType] = event.target.checked;
        updateVisibility();
        console.log("Hey");
    });
    row.appendChild(label);
    row.appendChild(formCheckbox);
    display_container.appendChild(row);
}


/**
 * This is where the visibility of each node/edge is updated
 * due to one of the topic and type checkboxes being clicked. It also refreshes
 * the renderer to insure that the updates are shown to the screen.
 */
async function updateVisibility() {
    graph.forEachNode((node, attributes) => {
        const topics = attributes.topics || [];
        const formType = attributes.form || "none";
        

        const topicVisible = topics.some(t => topicVisibility[t]) || (topics.length == 0 && topicVisibility["none"]);

        const typeVisible = typeVisibility[formType] ?? true;

        graph.setNodeAttribute(node, "hidden", !(topicVisible && typeVisible));
    });

    graph.forEachEdge((edge, attributes, source, target) => {
        const sourceTopics = graph.getNodeAttribute(source, "topics") || [];
        const targetTopics = graph.getNodeAttribute(target, "topics") || [];

        const visible = isNodeVisible(sourceTopics) && isNodeVisible(targetTopics);
        
        graph.setEdgeAttribute(edge, "hidden", !visible);
    });

    renderer.refresh();
}