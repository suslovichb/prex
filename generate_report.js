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

const queryGetRepositories = `query AllRepositories($cursor: String) {\
  viewer {\
    repositories(first:100, ownerAffiliations: [OWNER, ORGANIZATION_MEMBER, COLLABORATOR], affiliations: [OWNER, ORGANIZATION_MEMBER, COLLABORATOR], after: $cursor) {\
      nodes {\
        nameWithOwner\
      }\
    }\
  }\
}`

const query = `query {\
    viewer {\
      pullRequests(first: 100, states: OPEN) {\
        nodes {\
          createdAt\
          number\
          title\
          author {\
          login\
        }\
        updatedAt\
        url\
        }\
        totalCount\
      }\
    }\
  }`;

const queryGetPullRequests = ['{\
  search(query: "is:pr repo:', '", type: ISSUE, first: 100) {\
    edges {\
      node {\
        ... on PullRequest {\
          title\
          createdAt\
          url\
          state\
          author {\
            login\
          }\
          updatedAt\
        }\
      }\
    }\
  }\
}'];

let options = {};

async function loadPullRequests(data) {
    let repos = localStorage.getItem('repos');
    let requested_repositories = [];
    if (repos) {
        for (let repos_i = 0; repos_i < repos.length; repos_i++) {
            for (let data_i = 0; data_i < data.length; data_i++) {
                let name_external = data[data_i]['nameWithOwner'].split('/')[1];
                if (name_external === repos[repos_i]) {
                    requested_repositories.push(data[data_i]['nameWithOwner']);
                }
            }
        }
    } else {
        for (let i = 0; i < data.length; i++) {
            requested_repositories.push(data[i]['nameWithOwner']);
        }
    }
    let pullRequests = [];
    for (let i = 0; i < requested_repositories.length; i++) {
        let query = queryGetPullRequests[0] + requested_repositories[i] + queryGetPullRequests[1];
        options['body'] = JSON.stringify({"query": query});
        await fetch(`https://api.github.com/graphql`, options)
            .then(response => response.json())
            .then(data => pullRequests.push(data));
    }
    return pullRequests;
}

function filterPullRequests(pullRequests) {
    let openPullRequests = [];
    pullRequests.forEach(function (item) {
        item['data']['search']['edges'].forEach(function (item2) {
            if (item2['node']['state'] === 'OPEN') {
                openPullRequests.push(item2['node']);
            }
        })
    });
    let users = localStorage.getItem('users');
    let openUsersPullRequests = []
    if (users) {
        for (let i = 0; i < users.length; i++) {
            for (let k = 0; k < openPullRequests.length; k++) {
                if (users[i] === openPullRequests[k]['author']['login']) {
                    openUsersPullRequests.push(openPullRequests[k]);
                }
            }
        }
        return openUsersPullRequests;
    } else {
        return openPullRequests;
    }
}

function loadRepositories(accessToken) {
    options = {
        method: "post",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "bearer " + accessToken
        },
        body: JSON.stringify({
            "query": queryGetRepositories
        })
    };
    fetch(`https://api.github.com/graphql`, options)
        .then(response => response.json())
        .then(data => loadPullRequests(data['data']['viewer']['repositories']['nodes']))
        .then(data => filterPullRequests(data))
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




