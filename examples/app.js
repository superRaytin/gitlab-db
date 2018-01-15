import GitLabDB from 'gitlab-db'

const config = {
  dbName: 'apple',
  gitlab: {
    url: 'http://gitlab.example.com',
    token: 'your_access_token',
    repo: 'group/repo',
  },
}

export default class Example {
  constructor() {
    this.db = new GitLabDB(config.dbName, {
      url: config.gitlab.url,
      token: config.gitlab.token,
      repo: config.gitlab.repo,
    })
  }
  * initializeCollection(collectionName, options) {
    const isExists = yield this.db.isCollectionExists(collectionName)
    const defaultDocuments = []
    if (!isExists) {
      yield this.db.createCollection(collectionName, defaultDocuments)
    }
    return this.db.collection(collectionName, options)
  }
  * getCollection() {
    return yield this.initializeCollection('product', { key: 'name' })
  }
  * create(document) {
    const collection = yield this.getCollection()
    const newDocument = yield collection.save(document)
    if (newDocument === null) {
      console.log('collection already exists!')
    } else {
      console.log('collection created!')
    }
  }
}