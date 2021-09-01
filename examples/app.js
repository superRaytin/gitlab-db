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
  async initializeCollection(collectionName, options) {
    const isExists = await this.db.isCollectionExists(collectionName)
    const defaultDocuments = []
    if (!isExists) {
      await this.db.createCollection(collectionName, defaultDocuments)
    }
    return this.db.collection(collectionName, options)
  }
  async getCollection() {
    return await this.initializeCollection('product', { key: 'name' })
  }
  async create(document) {
    const collection = await this.getCollection()
    const newDocument = await collection.save(document)
    if (newDocument === null) {
      console.log('collection already exists!')
    } else {
      console.log('collection created!')
    }
  }
}