# gitlab-db
A lightweight Gitlab based JSON database with Mongo-style API. Backed by [gitbreaker](https://github.com/jdalrymple/gitbeaker) and [mingo](https://github.com/kofrasa/mingo).

[![NPM version][npm-image]][npm-url]
[![Downloads][downloads-image]][npm-url]

[npm-url]: https://npmjs.org/package/gitlab-db
[downloads-image]: http://img.shields.io/npm/dm/gitlab-db.svg
[npm-image]: http://img.shields.io/npm/v/gitlab-db.svg

## Install

```
npm i gitlab-db
```

## Quick Start

```js
import GitlabDB from 'gitlab-db'

// Instantiate a database
const db = new GitlabDB('apple', {
  url: 'http://gitlab.example.com',
  token: 'your_access_token',
  repo: 'group/repo',
})

// Create a collection
db.createCollection('product')

// CRUD
db.collection('product').save({ name: 'iphone', v: '8', price: 699 })
db.collection('product').find({ name: 'iphone' })
db.collection('product').update({ name: 'iphone', v: '8' }, { price: 599 })
db.collection('product').remove({ name: 'iphone', v: '7' })
```

Repository structure will be:

```
└── <repository root>
    ├── apple
    │   └── product.json
```

## API

Note: As all APIs returns a promise. I highly recommend the `async/await` statement like the following:

```js
const result = await db.collection('product').save({ name: 'iphone', v: '8', price: 699 })
```

### constructor(dbName, options[, customGitlabAPI])

Instantiate a database.

- **dbName:** `String` Name of the database you want to create.
- **options:** `Object`
  - **url:** `String` Specify gitlab url, eg: `http://gitlab.example.com`.
  - **token:** `String` Specify your personal access token.
  - **repo:** `String` Specify repository name and group belongs to, format: `group/repo`.
  - **branch:** `String` Optional, specify branch, default: `main`.
- **customGitlabAPI:** `Constructor` Specify your custom GitlabAPI like `@gitbeaker/browser`.

### db.createCollection(collectionName [, documents])

Create a collection.

- **collectionName:** `String` Name of the collection you want to create.
- **documents:** `Array` Optional. Specifies default data of the collection about to be created.

### db.collection(collectionName [, options])

Connect to a collection.

- **collectionName:** `String` Name of the collection you want to connect.
- **options:** `Object` Optional settings.
  - **key:** `String` Specify a key of the collection.

### db.collection(collectionName).save(document)

Inserts a new document(or multiple documents). This method will returns the inserted document(s).

- **document:** `Object` | `Array` A document or multiple documents to save to the collection.

Returns like:

> Insert single document:

```js
{ added: 1, document: {...} }
```

> Insert multiple documents:

```js
{ added: 2, documents: [{...}, {...}] }
```

Note: it will return `{ added: 0 }` if a key is specified and the document that the key points to already exists.

### db.collection(collectionName).find([query])

Selects documents in a collection.

- **query:** `Object` Optional. Specifies selection filter using query operators. To return all documents in a collection, omit this parameter or pass an empty document ({}).

Returns like:

```js
[{ _id: 1, ... }]
```

### db.collection(collectionName).update(query, update)

Modifies an existing document or documents in a collection.

- **query:** `Object` The selection criteria for the update. The same query selectors as in the find() method are available.
- **update:** `Object` The modifications to apply.

Returns like:

```js
{ updated: 2 }
```

Another usage, execute multiple updates at once to reduce gitlab requests:

```js
db.collection(collectionName).update([
    { query: { id: 1 }, update: { v: 1 } },
    { query: { id: 2 }, update: { v: 2 } },
])
```

### db.collection(collectionName).remove(query)

Removes documents from a collection.

- **query:** `Object` Specifies deletion criteria using query operators.

Returns like:

```js
{ removed: 1 }
```

### db.isCollectionExists(collectionName)

Check if a collection exists.

- **collectionName:** `String` Name of the collection you want to check.

Returns like:

```js
true
```

## Use in Browser

```js
import { Gitlab } from '@gitbeaker/browser'; 
import GitlabDB from 'gitlab-db'

// Instantiate a database
const db = new GitlabDB('apple', {
  url: 'http://gitlab.example.com',
  token: 'your_access_token',
  repo: 'group/repo',
}, Gitlab)

// ETC...
```

## Next

- [ ] model check
- [ ] collection deletion

## Test

Config your environment variables `GITLAB_URL` `ACCESS_TOKEN` `REPO`, and run tests with:

```
GITLAB_URL={your_gitlab_url} ACCESS_TOKEN={your_access_token} REPO={yourGroup/yourRepo} npm run test
```