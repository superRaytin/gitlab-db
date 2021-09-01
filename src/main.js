import { Gitlab } from '@gitbeaker/node'
import { initializeCollection, promiseAllSerial } from './utils'
import Collection from './collection'

class GitLabDB {
  constructor(dbName, options = {}, customGitlabAPI) {
    const defaultOptions = {
      branch: 'main',
    }
    const GitlabClient = customGitlabAPI || Gitlab
    this.dbName = dbName
    this.options = { ...defaultOptions, ...options }
    this.collections = {}
    this.gitlabClient = new GitlabClient({
      host: this.options.url,
      token: this.options.token,
    })
  }
  createCollection(collectionName, documents = []) {
    const initialContent = initializeCollection(documents)
    const { dbName } = this
    const { repo, branch } = this.options
    const projectId = repo
    const file_path = `${dbName}/${collectionName}.json`
    const branch_name = branch
    const content = JSON.stringify(initialContent)
    const commit_message = 'Create collection'
    return this.gitlabClient.RepositoryFiles.create(
      projectId,
      file_path,
      branch_name,
      content,
      commit_message,
    ).catch(() => {
      throw new Error(`[${collectionName}]: cannot override existing collections, use update instead`)
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
    const projectId = repo
    const file_path = `${dbName}/${collectionName}.json`
    const branch_name = branch
    return this.gitlabClient.RepositoryFiles.show(projectId, file_path, branch_name).then((res) => {
      return !!(res && res.file_name)
    }).catch((e) => {
      return false
    })
  }
}

module.exports = GitLabDB
