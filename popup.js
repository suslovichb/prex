document.getElementById("settings-btn").addEventListener("click", () => {
    chrome.tabs.create({url: "settings.html"})
});
let repositories = {};
let users = {};
chrome.storage.local.get('repositories', (data) => {
    Object.assign(repositories, JSON.parse(data.repositories));
});
chrome.storage.local.get('users', (data) => {
    Object.assign(users, JSON.parse(data.users));
});
document.getElementById("report-btn").addEventListener("click", () => {
    if (repositories && users ) {
        localStorage.setItem('Token', document.getElementById("token-input").value);
        chrome.tabs.create({url: "report.html"});
    } else {
        document.getElementById("errorHandler").innerHTML = 'Fill list of repos and users in settings';
    }
});

document.getElementById("token-gen-btn").addEventListener("click", () => {
    chrome.tabs.create({url: "https://github.com/settings/tokens/new"});
});

document.getElementById("tokens-btn").addEventListener("click", () => {
    chrome.tabs.create({url: "https://github.com/settings/tokens"});
});

$(document).ready(function () {
    let accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
        document.getElementById("token-input").hidden = true;
    }
});
