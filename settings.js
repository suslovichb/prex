$( document ).ready(function() {

    // First field - identifier - must be unique for every entity 
    const userFields = ["github", "alias"];
    const repositoryFields = ["path"];
    
    const usersContainerId = "users-table-container"
    const repositoriesContainerId = "repo-table-container"
    const tableClasses = ["table", "table-hover"]

    let users = new Set();
    let repositories = new Set();

    const setUsers = (newUsers) => {
        users = new Set(newUsers);
        buildTable(userFields, [...users], usersContainerId);
    }

    const setRepositories = (newRepositories) => {
        repositories = new Set(newRepositories);
        buildTable(repositoryFields, [...repositories], repositoriesContainerId);
    }

    const readLocalStorage = async (key) => {
        return new Promise((resolve, reject) => {
            chrome.storage.local.get([key], function (storage) {
                if (storage[key] === undefined) {
                    reject();
                } else {
                    resolve(storage[key]);
                }
            });
        });
    };

    const validateUsers = (users) => (Array.isArray(users) && users.length > 0);

    const loadLocalUsers = async () => {
        try {
            let localUsers = await readLocalStorage("users");
            let parsedUsers = JSON.parse(localUsers);
            validateUsers(parsedUsers) && setUsers(parsedUsers);
            return true;
        } catch(err) {
            console.log(err);
            return false;
        }  
    }

    const addUser = (user) => {
        loadLocalUsers().then((isLoaded) => {
            setUsers([...users, user]);
            chrome.storage.local.set(
                {"users": JSON.stringify([...users])},
                () => {}
            );
        }).catch((err) => {console.log(err)});
    }

    $("#add-user-form").submit(function(event) {
        event.preventDefault();
        let values = $(this).serializeArray().reduce((o,kv) => ({...o, [kv.name]: kv.value}), {});
        addUser(values);
        $(this).trigger("reset");
    });

    const validateRepositories = (repositories) => (Array.isArray(repositories) && repositories.length > 0);

    const loadLocalRepositories = async () => {
        try {
            let localRepositories = await readLocalStorage("repositories");
            let parsedRepositories = JSON.parse(localRepositories);
            validateRepositories(parsedRepositories) && setRepositories(parsedRepositories);
            return true;
        } catch(err) {
            console.log(err);
            return false;
        }  
    }

    const addRepository = (repository) => {
        loadLocalRepositories().then((isLoaded) => {
            setRepositories([...repositories, repository]);
            chrome.storage.local.set(
                {"repositories": JSON.stringify([...repositories])},
                () => {}
            );
        }).catch((err) => {console.log(err)});
    }

    $("#add-repo-form").submit(function(event) {
        event.preventDefault();
        let values = $(this).serializeArray().reduce((o,kv) => ({...o, [kv.name]: kv.value}), {});
        addRepository(values);
        $(this).trigger("reset");
    });

    const buildTable = (columnNames, items, htmlContainerId) => {
        let table = makeTable(columnNames, items);
        $("#" + htmlContainerId).html(table);
    }
    
    const makeTable = (columnNames, items) => {
        return (`
            <table class="${tableClasses.join(" ")}">
                <thead>
                    ${makeHeaders(columnNames)}
                    ${actionsHeader()}
                </thead>
                <tbody>
                    ${makeRows(columnNames, items)}
                </tbody>        
            </table>
        `);
    }

    const actionsHeader = () => {
        return `<th>actions</th>`;
    }

    const makeHeaders = (columnNames) => {
        return columnNames.map((columnName) => `<th>${columnName}</th>`).join("");
    }

    const makeRows = (columnNames, items) => {
        return items.map((item) => makeRow(columnNames, item)).join("")
    }

    const makeRow = (columnNames, item) => {
        let cells = columnNames.map((columnName) => `<td>${item[columnName]}</td>`).join("");
        return `<tr>${cells}${actionsCell(item[columnNames[0]])}</tr>`;
    }

    const actionsCell = (itemId) => {
        return (`
            <td>
                <button class="delete-btn" itemId="${itemId}">
                    Delete
                </button>
            </td>
        `);
    }

    const deleteUser = (id) => {
        setUsers(
            [...users].filter((user) => (user[userFields[0]] !== id))
        );

        chrome.storage.local.set(
            {"users":JSON.stringify([...users])}
        );
    }

    const deleteRepository = (id) => {
        setRepositories(
            [...repositories].filter((repo) => (repo[repositoryFields[0]] !== id))
        );

        chrome.storage.local.set(
            {"repositories":JSON.stringify([...repositories])}
        );
    }

    $('#users-table-container').on('click', '.delete-btn', function() {
        let id = $(this).attr('itemId');
        loadLocalUsers().then(() => {
            deleteUser(id)
        });
    });

    $('#repo-table-container').on('click', '.delete-btn', function() {
        let id = $(this).attr('itemId');
        loadLocalRepositories().then(() => {
            deleteRepository(id)
        });
    });

    loadLocalUsers();
    loadLocalRepositories();

});


