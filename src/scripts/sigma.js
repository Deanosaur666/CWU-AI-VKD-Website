/**
 * Ian Cunningham 4/21/2026
 * This file is to read all of the data from the JSON files and construct a
 * graph of nodes. The nodes are categorized by topic automatically. The only
 * limitation is if more than 9 topics are created then the coloring will break.
 */

import Graph from "graphology";
import Sigma from "sigma";
import circular from "graphology-layout/circular";
import forceAtlas2 from "graphology-layout-forceatlas2";



/**
 * This function loads the data from the JSON files. It currently only does this from
 * software.json as that is the only file with usable data at the time of writing. (4/21)
 * @returns graphData
 */
async function loadGraph() {
    const response = await fetch("/sources/software.json");
    const graphData = await response.json();
    return graphData;
}

let graph_json = await loadGraph();

let graph = new Graph({
    multi: true
});

//this populates the graph with the nodes
for(let i=0;i<graph_json.length;i++) {
    let node = graph_json[i];
    graph.addNode(node.id, node);
}

/**
 * This reads each of the topics from the JSON and creates an arraylist of them
 * and binds the nodes to that topic
 */
let topicMap = {};
graph.forEachNode((node, attributes) => {
    const topics = attributes.topics || [];

    for(const topic of topics) {
        if(!topicMap[topic]) {
            topicMap[topic] = [];
        }
        topicMap[topic].push(node);
    }
});

/**
 * The set colors that can be used for topics
 */
const palette = [
    "#FB2340", "#F8A025", "#1FE9FF",
    "#00EB62", "#0400EB", "#EB00E3",
    "#F5ED00", "#93F500", "#AF00F5"
]

//assigns each topic a color
const COLORS = {};
const topics = Object.keys(topicMap);
topics.forEach((topic, i) => {
    COLORS[topic] = palette[i % palette.length];
});

/**
 * Assigns the nodes their color based on their first topic. If there is
 * no topic then it sets the color to gray. This also makes nodes bigger 
 * based on the number of topics that it includes.
 */
graph.forEachNode((node, attributes) => {
    graph.setNodeAttribute(node, "color", COLORS[attributes.topics[0]] || "gray");
    graph.setNodeAttribute(node, "size", 5 + (5 * attributes.topics.length));
});

/**
 * This is where the edges are added. Each node connects to each other node
 * that shares any topic with it, and that edge has the color of the topic.
 */
for(const topic in topicMap) {
    const nodes = topicMap[topic];

    for(let i = 0; i < nodes.length; i++) {
        for(let j = i + 1; j < nodes.length; j++) {
            graph.addEdge(
                nodes[i],
                nodes[j],
                {
                    size: 5,
                    color: COLORS[topic]
                }
            );
        }
    }
}

/**
 * Organizes the graph based on genre. These are temporary numbers
 * and will change as the dataset increases to allow for a readable graph.
 * There is also the possibility to change to random instead of circular.
 */
circular.assign(graph);
const settings = forceAtlas2.inferSettings(graph);
settings.gravity = 0.1;
settings.scalingRatio = 10;
forceAtlas2.assign(graph, { settings, iterations: 2});


//creates renderer
const renderer = new Sigma(graph, document.getElementById("sigma-container"));

//insert snippet container
const snippet_container = document.getElementById("snippet-container");
const sigmaContainer = renderer.getContainer();

sigmaContainer.insertBefore(snippet_container, sigmaContainer.querySelector(".sigma-hovers"));

export { graph, renderer, topicMap, snippet_container };


//creates a dictionary for the visibility on each topic
const topicVisibility = {};
topics.forEach(topic => {
    topicVisibility[topic] = true;
});


/**
 * This creates the display-container by reading from
 * the topics and creating a div that has a checkbox and
 * label for each. The checkbox toggles the topicVisibility
 * and calls updateVisibility().
 */
const display_container = document.getElementById("display-container");
for(let i = 0; i < topics.length; i++) {
    const topic = topics[i];
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

    row.appendChild(label);
    row.appendChild(topicCheckbox);
    display_container.appendChild(row);

}

/**
 * This is where the visibility of each node/edge is updated
 * due to one of the topic checkboxes being clicked. It also refreshes
 * the renderer to insure that the updates are shown to the screen.
 */
async function updateVisibility() {
    graph.forEachNode((node, attributes) => {
        const topics = attributes.topics || [];

        const visible = topics.some(t => topicVisibility[t]);

        graph.setNodeAttribute(node, "hidden", !visible);
    });

    graph.forEachEdge((edge, attributes, source, target) => {
        const sourceTopics = graph.getNodeAttribute(source, "topics") || [];
        const targetTopics = graph.getNodeAttribute(target, "topics") || [];

        const visible = sourceTopics.some(t => topicVisibility[t]) &&
                        targetTopics.some(t => topicVisibility[t]);
        
        graph.setEdgeAttribute(edge, "hidden", !visible);
    });

    renderer.refresh();
}