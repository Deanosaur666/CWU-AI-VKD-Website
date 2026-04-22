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
import { Octokit, App } from "octokit";

const octokit = new Octokit({
    userAgent : "CWU-AI-VKD-Website"
});

/**
 * This function loads the data from the JSON files. It currently only does this from
 * software.json as that is the only file with usable data at the time of writing. (4/21)
 * @returns graphData
 */
async function loadGraph() {
    // API request
    let result = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
        owner: 'Deanosaur666',
        repo: 'CWU-AI-VKD-Website',
        path: 'sources/software.json',
    })

    // Decode Base64 content to text
    let decodedContent = atob(result.data.content);
    
    // Parse the text as JSON
    let graphData = JSON.parse(decodedContent);
    
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

export { graph, renderer };