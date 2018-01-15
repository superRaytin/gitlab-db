import GitLab from 'gitlab'
import { initializeCollection, promiseAllSerial } from './utils'
import Collection from './collection'

class GitLabDB {
  constructor(dbName, options = {}) {
    const defaultOptions = {
      branch: 'master',
    }
    this.dbName = dbName
    this.options = { ...defaultOptions, ...options }
    this.gitlabClient = new GitLab({
      url: this.options.url,
      token: this.options.token,
    })
    this.collections = {}
  }
  createCollection(collectionName, documents = []) {
    const initialContent = initializeCollection(documents)
    const { dbName } = this
    const { repo, branch } = this.options
    return new Promise((resolve, reject) => {
      this.gitlabClient.projects.repository.createFile({
        projectId: repo,
        file_path: `${dbName}/${collectionName}.json`,
        branch_name: branch,
        content: JSON.stringify(initialContent),
        commit_message: 'Create collection',
      }, (data) => {
        if (data === true) {
          return reject(new Error(`[${collectionName}]: cannot override existing collections, use update instead`))
        }
        resolve(data)
      })
    })
  }
  createCollections(collectionNames, documentsArray = []) {
    const promises = collectionNames.map((collectionName, index) => () => this.createCollection(collectionName, documentsArray[index]))
    return promiseAllSerial(promises)
  }
  collection(collectionName, options) {
    const collection = this.collections[collectionName]
    if (collection) {
      collection.setOptions(options)
      return collection
    } else {
      this.collections[collectionName] = new Collection(collectionName, {
        client: this.gitlabClient,
        dbName: this.dbName,
        repo: this.options.repo,
        branch: this.options.branch,
      }, options)
      return this.collections[collectionName]
    }
  }
  isCollectionExists(collectionName) {
    const { dbName } = this
    const { repo, branch } = this.options
    return new Promise((resolve) => {
      this.gitlabClient.projects.repository.showFile(repo, {
        file_path: `${dbName}/${collectionName}.json`,
        ref: branch,
      }, (data) => {
        if (data) {
          resolve(true)
        } else {
          resolve(false)
        }
      })
    })
  }
}

module.exports = GitLabDB
