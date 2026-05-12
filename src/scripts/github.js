/**
 * Dean Yockey 5/26/2026
 * This file is all about using the GitHub API
 */

import { Octokit, App } from "octokit";
import { Buffer } from "buffer";

let octokit = new Octokit();

let username = "";

// where to find the repo
const gh_owner = "Deanosaur666";
const gh_repo = "CWU-AI-VKD-Website"

// shas for files loaded, so we can update them
let gh_shas = {};
let gh_source_jsons = {};
let gh_source_modified = {};

// the indexes of these should correspond to paths below
let sourceTypes = [
    "article",
    "software"
]

let sourcePaths = [
    "sources/articles.json",
    "sources/software.json",

    "sources/other.json" // anything else
];

export async function ghAuth(authToken) {
    username = "";

    // Re-instantiate Octokit with the user's token
    octokit = new Octokit({ auth: authToken });

    try {
        // Test authentication
        const { data } = await octokit.request('GET /user');
        username = data.login; // set username
        console.log(`Successfully logged in as ${username}.`);
        return true;
      
    }
    catch (error) {
        if (error.status === 401) {
            console.log("Invalid token.");
        } else {
            console.log(`Login failure. Error status ${error.status}.`);
        }
        return false;
    }

}

async function ghGetJSON(path) {
    console.log(`ghGetJSon(${path})`);
    
    // API request
    let result = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
        owner: gh_owner,
        repo: gh_repo,
        path: path,
    })
    
    let sha = result.data.sha;

    gh_shas[path] = sha;

    // Decode Base64 content to text
    let decodedContent = atob(result.data.content);
    
    // Parse the text as JSON
    let json = JSON.parse(decodedContent);

    gh_source_jsons[path] = json;
    gh_source_modified[path] = false;
    
    return json;
}

async function ghUploadJSON(object, path) {
    // you can't upload if you're not logged in
    if(!username) {
        console.log("User must authenticate with GitHub personal access token to upload data.");
        return false;
    }

    const content = Buffer.from(JSON.stringify(object)).toString("base64");
    const fileContent = await octokit.rest.repos.createOrUpdateFileContents({
        owner: gh_owner,
        repo: gh_repo,
        path: path,
        branch: "main",
        sha: gh_shas[path],
        message: `Update file ${path} via API.`,
        content,
    });

    const { commit: { html_url } } = fileContent.data;

    console.log(`File ${path} updated. See changes at ${html_url}.`);
}

export async function ghGetSourceJSONs() {
    let objects = [];
    for(let i = 0; i < sourcePaths.length; i ++) {
        let sourceObjects = await ghGetJSON(sourcePaths[i]);
        objects = objects.concat(sourceObjects);
    }
    return objects;
}

export async function ghUploadModifed() {
    for(const [key, value] of Object.entries(gh_source_jsons)) {
        if(gh_source_modified[key]) {
            ghUploadJSON(value, key);
            gh_source_modified[key] = false;
        }
    }
}

export function ghAddSource(sourceFilePath, object) {
    // add object to end of the array
    gh_source_jsons[sourceFilePath].push(object);
    // this file has been modified
    gh_source_modified[sourceFilePath] = true;
}

const info_container = document.getElementById("info-container");
const display_container = document.getElementById("display-container");

// the button for adding a source
const row = document.createElement("div");
row.className = "button-row";

//adds button to div
const addSourceButton = document.createElement("button");
addSourceButton.textContent = "Add source";

addSourceButton.addEventListener("click", () => {
    ghAddSourceForm();
});

row.appendChild(addSourceButton);
display_container.appendChild(row);

const sourceFormFields = [
    // a dropdown list from sourceTypes,
    // determines what file to add to, for
    {
        id : "typeSelector",
        label : "Source type:",
        element : "select",
        innerHTML :
            `
            <option value="software">Software</option>
            <option value="article">Article</option>
            <option value="book">Book</option>
            <option value="other">Other</option>
            `,
        jsonkey : "form",
        required : true,
    },
    // ID field
    {
        id : "idField",
        label : "ID: ",
        element : "input",
        type : "text",
        jsonkey : "id"
    },
    // Link field
    {
        id : "linkField",
        label : "Link: ",
        element : "input",
        type : "text",
        jsonkey : "link",
        required : true,
    },
    // Title field
    {
        id : "titleField",
        label : "Title: ",
        element : "input",
        type : "text",
        jsonkey : "title",
        required : "true"
    },
    // Date field
    {
        id : "dateField",
        label : "Date: ",
        element : "input",
        type : "date",
        jsonkey : "date"
    },
    // Authors field (list, maybe comma seperated or something?)
    {
        id : "authorField",
        label : "Authors: ",
        element : "input",
        type : "text",
        jsonkey : "authors",
        jsontype : "array",
        required : true,
    },  // would like something nicer than just a normal textox, maybe using horsey or something?
        // but this is a placeholder for now I guess

    // Topics field (list like above)
    {
        id : "topicsField",
        label : "Topics: ",
        element : "input",
        type : "text",
        jsonkey : "topics",
        jsontype : "array"
    },

    // can I make these only appear based on what the type is?
    // ISBN
    {
        id : "isbnField",
        label : "ISBN: ",
        element : "input",
        type : "text",
        jsonkey : "isbn",
        visibleon : ["book", "other"]
    },

    // DOI
    {
        id : "doiField",
        label : "DOI: ",
        element : "input",
        type : "text",
        jsonkey : "doi",
        visibleon : ["book", "article", "other"]
    },

    // Publisher
    {
        id : "publisherField",
        label : "Publisher: ",
        element : "input",
        type : "text",
        jsonkey : "publisher",
        visibleon : ["book", "article", "other"]
    },

    // Cites field (list)
    {
        id : "citesField",
        label : "Cites: ",
        element : "input",
        type : "text",
        jsonkey : "cites",
        jsontype : "array"
    },

    // Summary field (big text box)
    // 5 rows or something?
    // textarea element
    {
        id : "summaryField",
        label : "Summary: ",
        element : "textarea",
        jsonkey : "summary",
        required : true,
    },
];

// create GUI form to enter data
export function ghAddSourceForm() {

    let type = null;
    let typeSelector = document.getElementById("typeSelector");
    if(typeSelector) {
        type = typeSelector.value;
        console.log(type);
    }

    // title
    info_container.innerHTML = "<div><strong>Add source</strong></div>";

    // fields
    for(let i = 0; i < sourceFormFields.length; i ++) {
        const field = sourceFormFields[i];

        // skip if not visible for this type
        if(type && ("visibleon" in field) && !field.visibleon.includes(type)) {
            console.log(field.jsonkey);
            continue;
        }

        const row = document.createElement("div");
        row.className = "field-row";

        // label
        if("label" in field) {
            const label = document.createElement("label");
            label.setAttribute("for", field.id)
            label.textContent = field.label;
            row.appendChild(label);
        }

        const fieldElement = document.createElement(field.element);
        fieldElement.id = field.id;
        if("innerHTML" in field) {
            fieldElement.innerHTML = field.innerHTML;
        }
        if("type" in field) {
            fieldElement.setAttribute("type", field.type);
        }

        row.appendChild(fieldElement);
        info_container.appendChild(row);
    }

    typeSelector = document.getElementById("typeSelector");
    typeSelector.addEventListener("change", ghAddSourceForm);
    typeSelector.value = type;

    // submit button
    const row = document.createElement("div");
    row.className = "button-row";

    //adds button to div
    const addSourceButton = document.createElement("button");
    addSourceButton.textContent = "Submit source";

    addSourceButton.addEventListener("click", () => {
        /* Add source to json array or whatever */
    });

    row.appendChild(addSourceButton);
    info_container.appendChild(row);
}