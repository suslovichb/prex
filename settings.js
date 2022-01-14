$( document ).ready(function() {

    let users = new Set();
    let repositories = new Set();

    const setUsers = (newUsers) => {
        users = new Set(newUsers);
    }

    const setRepositories = (newRepositories) => {
        repositories = new Set(newRepositories);
    }

    const loadLocalUsers = () => {
        chrome.storage.local.get("users", (storage) => {
            loadedUsers = JSON.parse(storage.users);
            setUsers(loadedUsers);
        })
    }

    const addUser = (user) => {
        loadLocalUsers();
        users.add(user);
        chrome.storage.local.set(
            {"users": JSON.stringify([...users])},
            () => { 
                chrome.storage.local.get("users", (storage) => {
                    console.log(storage);
                }) 
             }
        );
    }

    $("#add-user-form").submit(event => {
        event.preventDefault();
        let values = $(this).serializeArray().reduce((o,kv) => ({...o, [kv.name]: kv.value}), {});
        addUser(values);
    });

    // const addRepository = (repository) => {
    //     repositories.add(repository);
    //     chrome.storage.local.set(
    //         {"repositories": JSON.stringify([...repositories])},
    //         () => { 
    //             chrome.storage.local.get("repositories", (storage) => {
    //                 console.log(storage);
    //             })
    //          }
    //     );
    // }    


    // const extendRepositories = (newUsers) => {
    //     newUsers.forEach(repositories.add, repositories)
    // }

    // const loadLocalRepositories = () => {
    //     chrome.storage.local.get("repositories", (storage) => {
    //         loadedRepositories = JSON.parse(storage.repositories);
    //         extendRepositories(loadedRepositories);
    //     })
    // }

    

    // $("#add-repo-form").submit(function(event) {
    //     event.preventDefault();
    //     let values = $(this).serializeArray().reduce((o,kv) => ({...o, [kv.name]: kv.value}), {});
    //     addRepository(values);
    // });

    const loadLocalRepositories = () => {
        chrome.storage.local.get("repositories", (storage) => {
            loadedRepositories = JSON.parse(storage.repositories);
            setUsers(loadedRepositories);
        })
    }

    const addRepository = (repository) => {
        loadLocalRepositories();
        repositories.add(repository);
        chrome.storage.local.set(
            {"repository": JSON.stringify([...repositories])},
            () => { 
                chrome.storage.local.get("repository", (storage) => {
                    console.log(storage);
                }) 
             }
        );
    }

    $("#add-repo-form").submit(event => {
        event.preventDefault();
        let values = $(this).serializeArray().reduce((o,kv) => ({...o, [kv.name]: kv.value}), {});
        addRepository(values);
    });

    loadLocalUsers();
    loadLocalRepositories();

    const buildUsersTable = () => {

    }

});


