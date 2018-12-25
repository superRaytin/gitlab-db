import Mingo from 'mingo'
import { initializeDocument, updateModifiedTime } from './utils'

export default class Collection {
  constructor(collectionName, gitlabConfig, options = {}) {
    this.name = collectionName
    this.gitlabConfig = gitlabConfig
    this.options = options
  }
  _getFileContent() {
    const { name } = this
    const { client, dbName, repo, branch } = this.gitlabConfig
    return new Promise((resolve, reject) => {
      client.projects.repository.showFile(repo, {
        file_path: `${dbName}/${name}.json`,
        ref: branch,
      }, (data) => {
        if (!data) return reject(new Error(`[${name}]: collection does not exist`))
        const content = Buffer.from(data.content, 'base64').toString()
        try {
          const result = JSON.parse(content)
          resolve(result)
        } catch (e) {
          reject(new Error(`[${name}]: collection content must be a valid JSON object`))
        }
      })
    })
  }
  _writeFileContent(content) {
    const { name } = this
    const { client, dbName, repo, branch } = this.gitlabConfig
    return new Promise((resolve) => {
      client.projects.repository.updateFile({
        projectId: repo,
        file_path: `${dbName}/${name}.json`,
        branch_name: branch,
        content: JSON.stringify(content),
        commit_message: 'Update collection',
      }, (data) => {
        resolve(data)
      })
    })
  }
  setOptions(options) {
    this.options = { ...this.options || {}, options }
  }
  save(doc) {
    const { options } = this
    const isBatchMode = Object.prototype.toString.call(doc) === '[object Array]'
    // get all documents
    return this.find().then((documents) => {
      let willBeInserted = isBatchMode ? doc : [doc]
      // check if a key is specified
      const collectionKey = options.key
      if (collectionKey) {
        willBeInserted = willBeInserted.filter((item) => {
          const found = documents.find((originalItem) => originalItem[collectionKey] === item[collectionKey])
          return !found
        })
      }
      willBeInserted = willBeInserted.map(item => initializeDocument(item))

      const newContent = documents.concat(willBeInserted)
      const result = { added: willBeInserted.length }
      if (result.added === 1) {
        result.document = willBeInserted[0]
      } else if (result.added > 1) {
        result.documents = willBeInserted
      }

      return this._writeFileContent(newContent).then(() => result)
    })
  }
  remove(query) {
    const meta = { removed: 0 }
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
    const meta = { updated: 0 }
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
}
