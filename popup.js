document.getElementById("settings-btn").addEventListener("click", () => {
    chrome.tabs.create({url: "settings.html"})
});

document.getElementById("report-btn").addEventListener("click", () => {
    chrome.tabs.create({url: "report.html"});
    chrome.runtime.onMessage.addListener(
        function (request, sender, sendResponse) {
            if (request.Ready === 'True') {
                chrome.runtime.sendMessage({Token: document.getElementById("TokenFieldId").value});
            }
        }
    )
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
