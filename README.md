# gitlab-db
A lightweight GitLab based JSON database with Mongo-style API.

### Install

```
npm i gitlab-db
```

### Usage

```js
import GitLabDB from 'gitlab-db'

// Instantiate a database
const db = new GitLabDB('yourDbName', {
	url: 'http://gitlab.example.com',
	token: 'your_access_token',
	repo: 'groupName/repoName',
})

// Create a collection
db.createCollection('project')

// CRUD
db.collection('project').save({ name: 'test', ... })
db.collection('project').remove({ name: 'test', ... })
db.collection('project').update({ name: 'test', ... }, { name: 'test1' })
db.collection('project').find({ name: 'test', ... })
```

### Create a collection with default data

```js
db.createCollection('project', [{ a: 1, b: 2 }])
```

### Next

- [ ] multi save
- [ ] model check

### Test

Config your environment variables `GITLAB_URL` `ACCESS_TOKEN` `REPO`, run tests with:

```
GITLAB_URL={your_gitlab_url} ACCESS_TOKEN={your_access_token} REPO={yourGroup/yourRepo} npm run test
```