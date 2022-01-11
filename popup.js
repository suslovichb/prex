document.getElementById("home-btn").addEventListener("click", () => {
    chrome.tabs.create({url: "home.html"})
});

document.getElementById("report-btn").addEventListener("click", () => {
    const repos = localStorage.getItem('repos');
    const users = localStorage.getItem('users');
    if (repos && users) {
        chrome.tabs.create({url: "report.html"});
        chrome.runtime.onMessage.addListener(
            function (request, sender, sendResponse) {
                if (request.Ready === 'True') {
                    chrome.runtime.sendMessage({Token: document.getElementById("TokenFieldId").value});
                }
            }
        )
    } else {
        if (repos === null && users === null) {
            document.getElementById("errorHandler").innerHTML = 'Fill list of repos and users in settings';
        } else if (repos === null) {
            document.getElementById("errorHandler").innerHTML = 'Fill list of repos in settings';
        } else {
            document.getElementById("errorHandler").innerHTML = 'Fill list of users in settings';
        }
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
        document.getElementById("TokenFieldId").hidden = true;
    }
});