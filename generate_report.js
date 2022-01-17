$(document).ready(function () {
    let accessToken = localStorage.getItem('accessToken');
    document.querySelector('.preloader').style.display = 'flex';
    if (accessToken) {
        getPullRequests(accessToken).then(r => generateTable(r));
    } else {
        chrome.runtime.sendMessage({Ready: 'True'});
        chrome.runtime.onMessage.addListener(
            function (request, sender, sendResponse) {
                accessToken = request.Token;
                getPullRequests(accessToken).then(r => generateTable(r));
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
    const reposStorage = JSON.parse(localStorage.getItem('repositories'));
    let listRepos = [];
    for (const repo of reposStorage) {
        listRepos.push(repo['link']);
    }
    return listRepos;
}

function getUserQuery() {
    const users = JSON.parse(localStorage.getItem('users'));
    let userQueries = [];
    for (const user of users) {
        userQueries.push("author:" + user['github'] + " ");
        userQuerys.push("author:" + user['link'] + " ");
    }
    return userQueries;
}


async function getPullRequests(accessToken) {
    let options = {
        method: "post",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "bearer " + accessToken
        },
        body: ""
    };
    const listRepos = getListRepos();
    const userQueries = getUserQuery();
    let pullRequests = [];
    try {
        for (const repo of listRepos) {
            for (const userQuery of userQueries) {
                options['body'] = JSON.stringify({
                    "query": queryGetPullRequests[0] + "repo:" + repo + " " + userQuery + queryGetPullRequests[1]
                });
                let response = (await (await fetch(`https://api.github.com/graphql`, options)).json());
                for (const responseIterator of response['data']['search']['edges']) {
                    pullRequests.push(responseIterator['node']);
                }
            }
        }
    } catch (e) {
        console.log(e);
    }
    return pullRequests;
}


function generateTable(data) {
    const dataKeys = ['number', 'title', 'author', 'url', 'pending days'];
    let table = "<table><thead><tr>";
    const today = Date.now();
    for (const dataKey of dataKeys) {
        table += "<th>" + dataKey + "</th>";
    }
    table += "</tr></thead><tbody>";
    table += data.map((item, index) => '<tr class="table-light"><td>' + (index + 1) + "</td><td>" + item['title'] +
        "</td><td>" + item['author']['name'] + '</td><td><a href="' + item['url'] + '">' + item['url'] + '</a></td><td>'
        + Math.trunc((today - Date.parse(item['updatedAt'])) / (1000 * 3600 * 24)) + "</td></tr>"
    );
    table += "</tbody></table>";

    document.querySelector('.preloader').style.display = 'none';
    document.getElementById("reportTable").innerHTML = table;
}




