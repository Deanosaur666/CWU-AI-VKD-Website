/**
 * Ian Cunningham 4/21/2026
 * This is for the additional functionality on the website. These include:
 * 1. Hovering over the node will show info to snippet-container
 * 2. The logic for hte help window
 */
import { graph, renderer, topicMap, snippet_container } from './sigma.js';
import { setSelectedSource, getSelectedSource, ghAddSourceForm } from './github.js';

const helpWindow = document.getElementById("help-window");
const openHelpWindowBtn = document.getElementById("help-button");
const closeHelpWindowBtn = document.getElementById("close-help-window");

openHelpWindowBtn.onclick = function() {
    helpWindow.style.display = helpWindow.style.display === "block"
        ? "none"
        : "block";
}

closeHelpWindowBtn.onclick = function() {
    helpWindow.style.display = "none";
}

const aboutWindow = document.getElementById("about-window");
const openAboutWindowBtn = document.getElementById("about-button");
const closeAboutWindowBtn = document.getElementById("close-about-window");

openAboutWindowBtn.onclick = function() {
    //console.log("Hey");
    aboutWindow.style.display = aboutWindow.style.display === "block"
        ? "none"
        : "block";
}

closeAboutWindowBtn.onclick = function() {
    aboutWindow.style.display = "none";
}

/**
 * This is the code that displays the info about each document
 * when the node is clicked. This is not the final product as
 * it will have to change to allow for different types of documents
 * that will have more/less data to display :)
 */
const info_container = document.getElementById("info-container");

renderer.on("clickNode", ({node}) => {
    const data = graph.getNodeAttributes(node);

    let linkElement = `<a href="${data.link}" target="_blank">Link</a>`;
    if(!data.link)
        linkElement = ""; // no link
    const citations = (data.cites || [])
        .map(cite => `<li>- ${cite}</li>`)
        .join("");

    info_container.innerHTML =
    `<strong>${data.title}</strong>
    <br>Date: ${data.date}</br>
    <br>Authors: ${data.authors}</br>
    <br>Topics: ${data.topics}</br>
    ${linkElement}
    <br>Citations: ${citations}</br>
    <br>Summary: ${data.summary}</br>
    <button id="editSourceButton">Edit source</button>
    `;

    setSelectedSource(data);
    const editSourceButton = document.getElementById("editSourceButton");
    editSourceButton.addEventListener("click", () => {
        ghAddSourceForm(getSelectedSource());
    });
});

/**
 * This makes the snippet_container appear on the screen when
 * a node is hovered. The positioning on the node is not yet
 * implemented and it stays in the top left corner. It currently
 * displays the title, date, and topics of the hovered node
 */
renderer.on("enterNode", (event) => {
    const data = graph.getNodeAttributes(event.node);
    
    const x = event.event.x;
    const y = event.event.y;

    const offsetX = 15;
    const offsetY = -30;

    snippet_container.style.left = `${x + offsetX}px`;
    snippet_container.style.top = `${y + offsetY}px`;

    snippet_container.innerHTML =
    `<strong>${data.title}</strong>
    <br>Date: ${data.date}</br>
    <br>Topics: ${data.topics}</br>
    `;
    snippet_container.style.display = "block";
});

//hides the snippet_container
renderer.on("leaveNode", () => {
    snippet_container.style.display = "none";
});


