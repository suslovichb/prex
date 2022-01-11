$(document).ready(function () {
    chrome.runtime.sendMessage({Ready: 'True'});
    let accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
        loadPullRequests(accessToken);
    } else {
        chrome.runtime.onMessage.addListener(
            function (request, sender, sendResponse) {
                accessToken = request.Token;
                loadPullRequests(accessToken);
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

const queryGetPullRequests = ['{\
  search(query: "is:pr ', ' state:open", type: ISSUE, first: 100) {\
    edges {\
      node {\
        ... on PullRequest {\
          title\
          url\
          state\
          author {\
            ... on User {\
              name\
            }\
            }\
          updatedAt\
        }\
      }\
    }\
  }\
}'];

let options = {};


async function loadPullRequests(accessToken) {
    options = {
        method: "post",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "bearer " + accessToken
        },
        body: ""
    };
    let reposStorage = localStorage.getItem('repos');
    let repo_indexer = "";
    if (reposStorage === null) {
        options['body'] = JSON.stringify({"query": queryGetRepositories});
        reposStorage = (await (await fetch(`https://api.github.com/graphql`, options)).json());
        reposStorage = reposStorage['data']['viewer']['repositories']['nodes'];
        repo_indexer = 'nameWithOwner';
    } else {
        repo_indexer = 'link';
    }
    let repos = [];
    for (let repo_i = 0; repo_i < reposStorage.length; repo_i++) {
        repos.push(reposStorage[repo_i][repo_indexer]);
    }
    let users = localStorage.getItem('users');
    let users_query = "";
    if (users) {
        for (let user_i = 0; user_i < users.length; user_i++) {
            users_query += "author:" + users[user_i]['github'];
        }
    }
    let PullRequests = [];
    for (let repo_i = 0; repo_i < repos.length; repo_i++) {
        options['body'] = JSON.stringify({
            "query": queryGetPullRequests[0] + "repo:" + repos[repo_i] + users_query + queryGetPullRequests[1]
        });
        let response = (await (await fetch(`https://api.github.com/graphql`, options)).json());
        let data = response['data']['search']['edges'];
        for (let data_i = 0; data_i < data.length; data_i++) {
            PullRequests.push(data[data_i]['node']);
        }
    }
    generateTable(PullRequests);
}


function generateTable(data) {
    let dataKey = ['number', 'title', 'author', 'url', 'pending days'];
    let table = "<table>";
    table += "<thead><tr>";
    for (let key in dataKey) {
        table += "<th>" + dataKey[key] + "</th>";
    }
    table += "</tr></thead>";
    table += "<tbody>";
    for (let i = 0; i < data.length; i++) {
        table += '<tr class="table-light">';
        for (let j in dataKey) {
            if (dataKey[j] === 'author') {
                table += "<td>" + data[i][dataKey[j]]['name'] + "</td>";
            } else if (dataKey[j] === 'number') {
                table += "<td>" + (i + 1) + "</td>";
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




