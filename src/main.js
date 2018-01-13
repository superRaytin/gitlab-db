import GitLab from 'gitlab'
import Mingo from 'mingo'
import { createNewDocument, createNewCollection, updateModifiedTime, promiseAllSerial } from './utils'

module.exports = class GitLabDB {
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
  }
  _getFileContent() {
    const { dbName, collectionName } = this
    const { repo, branch } = this.options
    return new Promise((resolve, reject) => {
      this.gitlabClient.projects.repository.showFile(repo, {
        file_path: `${dbName}/${collectionName}.json`,
        ref: branch,
      }, (data) => {
        if (!data) return reject(new Error(`[${collectionName}]: collection does not exist`))
        const content = Buffer.from(data.content, 'base64').toString()
        try {
          const result = JSON.parse(content)
          resolve(result)
        } catch (e) {
          reject(new Error(`[${collectionName}]: collection content must be a valid JSON object`))
        }
      })
    })
  }
  _writeFileContent(content) {
    const { dbName, collectionName } = this
    const { repo, branch } = this.options
    return new Promise((resolve) => {
      this.gitlabClient.projects.repository.updateFile({
        projectId: repo,
        file_path: `${dbName}/${collectionName}.json`,
        branch_name: branch,
        content: JSON.stringify(content),
        commit_message: 'update collection',
      }, (data) => {
        resolve(data)
      })
    })
  }
  createCollection(collectionName, documents = []) {
    const initialContent = createNewCollection(documents)
    const { dbName } = this
    const { repo, branch } = this.options
    return new Promise((resolve, reject) => {
      this.gitlabClient.projects.repository.createFile({
        projectId: repo,
        file_path: `${dbName}/${collectionName}.json`,
        branch_name: branch,
        content: JSON.stringify(initialContent),
        commit_message: 'create collection',
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
  collection(collectionName) {
    this.collectionName = collectionName
    return this
  }
  save(document) {
    const meta = {
      added: 1,
    }
    // get all documents
    return this.find().then((documents) => {
      const newDocument = createNewDocument(document)
      documents.push(newDocument)
      return this._writeFileContent(documents).then(() => ({ ...meta, document: newDocument }))
    })
  }
  remove(query) {
    const meta = {
      removed: 0,
    }
    // get all documents
    return this.find().then((documents) => {
      const Query = new Mingo.Query(query)
      const remain = Query.remove(documents)
      const removed = documents.length - remain.length
      meta.removed = removed
      return this._writeFileContent(remain).then(() => meta)
    })
  }
  update(query, update) {
    const meta = {
      updated: 0,
    }
    const safeData = { ...updateModifiedTime(update) }
    // protect _id from overriding by user
    if (safeData._id) delete safeData._id

    // get all documents
    return this.find().then((content) => {
      if (!content.length) return meta

      // find elements which should be updated
      const Query = new Mingo.Query(query)
      const cursor = Query.find(content)
      const willBeUpdate = cursor.all()

      // update elements, it will be inserted to result
      const updated = willBeUpdate.map((item) => ({ ...item, ...safeData }))

      // remove elements which should be updated
      const remain = Query.remove(content)

      // insert the updated elements to result
      const result = remain.concat(updated)

      meta.updated = content.length
      return this._writeFileContent(result).then(() => meta)
    })
  }
  find(query = {}) {
    const Query = new Mingo.Query(query)
    return this._getFileContent().then((content) => {
      const cursor = Query.find(content)
      const result = cursor.all()
      return result
    })
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
