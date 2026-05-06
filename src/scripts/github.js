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

let sourcePaths = [
    "sources/articles.json",
    "sources/software.json"
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