const query = `{
    user(login: "username") {
      pullRequests(first: 100, states: OPEN) {
        totalCount
        nodes {
          createdAt
          number
          title
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }`;


const loadPullRequests = () => {
    const options = {
      method: "post",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query
      })
    };

    fetch(`https://api.github.com/graphql`, options)
        .then(response => console.log(response));
}


loadPullRequests();