$(document).ready(function () {
    chrome.runtime.sendMessage({Ready: 'True'});
    let accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
        loadPullRequests(accessToken);
    } else {
        chrome.runtime.onMessage.addListener(
            function (request, sender, sendResponse) {
                accessToken = request.Token;
                loadRepositories(accessToken);
            }
        )
    }
});

const query = 'query AllRepositories($cursor: String) {\n' +
    '  viewer {\n' +
    '    repositories(first: 100, ownerAffiliations: [OWNER, ORGANIZATION_MEMBER, COLLABORATOR], affiliations: [OWNER, ORGANIZATION_MEMBER, COLLABORATOR], after: $cursor) {\n' +
    '      nodes {\n' +
    '        nameWithOwner\n' +
    '        name\n' +
    '        pullRequests(first: 100, states: OPEN) {\n' +
    '          nodes {\n' +
    '            title\n' +
    '            createdAt\n' +
    '            url\n' +
    '            author {\n' +
    '              login\n' +
    '            }\n' +
    '            updatedAt\n' +
    '          }\n' +
    '        }\n' +
    '      }\n' +
    '    }\n' +
    '  }\n' +
    '}\n';

async function loadPullRequests(data) {
    let repos = localStorage.getItem('repos');
    let requested_repositories = [];
    if (repos) {
        for (let repos_i = 0; repos_i < repos.length; repos_i++) {
            for (let data_i = 0; data_i < data.length; data_i++) {
                if (data[data_i]['name'] === repos[repos_i] || data[data_i]['nameWithOwner'] === repos[repos_i]) {
                    requested_repositories.push(data[data_i]);
                }
            }
        }
    } else {
        for (let i = 0; i < data.length; i++) {
            requested_repositories.push(data[i]);
        }
    }
    let users = localStorage.getItem('users');
    let pullRequests = [];
    if (users) {
        for (let i = 0; i < users.length; i++) {
            for (let k = 0; k < requested_repositories.length; k++) {
                for (let PRk = 0; PRk < requested_repositories[k]['pullRequests']['nodes'].length; PRk++) {
                    if (users[i]['github'] === requested_repositories[k]['pullRequests']['nodes'][PRk]['author']['login']) {
                        pullRequests.push(requested_repositories[k]['pullRequests']['nodes'][PRk]);
                    }
                }
            }
        }
    } else {
        for (let k = 0; k < requested_repositories.length; k++) {
            for (let PRk = 0; PRk < requested_repositories[k]['pullRequests']['nodes'].length; PRk++) {
                pullRequests.push(requested_repositories[k]['pullRequests']['nodes'][PRk]);
            }
        }
    }
    return pullRequests;
}

function loadRepositories(accessToken) {
    let options = {
        method: "post",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "bearer " + accessToken
        },
        body: JSON.stringify({
            "query": query
        })
    };
    fetch(`https://api.github.com/graphql`, options)
        .then(response => response.json())
        .then(data => loadPullRequests(data['data']['viewer']['repositories']['nodes']))
        .then(data => generateTable(data))
        .catch(error => console.log(error));
}


function generateTable(data) {
    let dataKey = ['createdAt', 'title', 'author', 'updatedAt', 'url', 'pending days'];
    let table = "<table>";
    table += "<thead><tr>";
    for (let key in dataKey) {
        table += "<th>" + dataKey[key] + "</th>";
    }
    table += "</tr></thead>";

    table += "<tbody>";
    for (let i = 0; i < data.length; i++) {
        table += '<tr class="table-light" id="' + data[i]['url'] + '">';
        for (let j in dataKey) {
            if (dataKey[j] === 'author') {
                table += "<td>" + data[i][dataKey[j]]['login'] + "</td>";
            } else if (dataKey[j] === 'url') {
                table += '<td><a href="' + data[i][dataKey[j]] + '">' + data[i][dataKey[j]] + '</a></td>';
            } else if (dataKey[j] === 'pending days') {
                table += "<td>" + Math.trunc((Date.now() - Date.parse(data[i]['updatedAt'])) / (1000 * 3600 * 24)) + "</td>";
            } else {
                table += "<td>" + data[i][dataKey[j]] + "</td>";
            }
        }
        table += "</tr>";
    }
    table += "</tbody></table>";

    document.getElementById("table").innerHTML = table;
}




