$(document).ready(function () {
    let accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
        loadPullRequests(accessToken);
    } else {
        chrome.runtime.sendMessage({Ready: 'True'});
        chrome.runtime.onMessage.addListener(
            function (request, sender, sendResponse) {
                accessToken = request.Token;
                loadPullRequests(accessToken);
            }
        )
    }
});


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


function getListRepos() {
    const reposStorage = JSON.parse(localStorage.getItem('repos'));
    let listRepos = [];
    for (const repo of reposStorage) {
        console.log(repo);
        listRepos.push(repo['link']);
    }
    return listRepos;
}

function getUserQuery() {
    const users = JSON.parse(localStorage.getItem('users'));
    let usersQuery = "";
    for (const user of users) {
        usersQuery += "author:" + user['github'] + " ";
    }
    return usersQuery;
}


async function loadPullRequests(accessToken) {
    let options = {
        method: "post",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "bearer " + accessToken
        },
        body: ""
    };
    const listRepos = getListRepos();
    const usersQuery = getUserQuery();
    let pullRequests = [];
    for (const repo of listRepos) {
        options['body'] = JSON.stringify({
            "query": queryGetPullRequests[0] + "repo:" + repo + " " + usersQuery + queryGetPullRequests[1]
        });
        let response = (await (await fetch(`https://api.github.com/graphql`, options)).json());
        let response_filtered = response['data']['search']['edges'];
        for (const data of response_filtered) {
            pullRequests.push(data['node']);
        }
    }
    generateTable(pullRequests);
}


function generateTable(data) {
    const dataKey = ['number', 'title', 'author', 'url', 'pending days'];
    let table = "<table><thead><tr>";
    const today = Date.now();
    for (const key in dataKey) {
        table += "<th>" + dataKey[key] + "</th>";
    }
    table += "</tr></thead><tbody>";
    for (let i = 0; i < data.length; i++) {
        table += '<tr class="table-light"><td>' + (i + 1) + "</td><td>" + data[i]['title'] + "</td><td>" + data[i]['author']['name'] +
            '</td><td><a href="' + data[i]['url'] + '">' + data[i]['url'] + '</a></td><td>' +
            Math.trunc((today - Date.parse(data[i]['updatedAt'])) / (1000 * 3600 * 24)) + "</td></tr>";
    }
    table += "</tbody></table>";

    document.getElementById("table").innerHTML = table;
}




