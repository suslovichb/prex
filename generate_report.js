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


function loadPullRequests(accessToken) {
    const options = {
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
        .then(data => generateTable(data['data']['viewer']['pullRequests']['nodes']))
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




