import assert from 'assert'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import cleanRepositry from './cleanRepositry'
import GitLabDB from '../dist/main'

chai.use(chaiAsPromised)

if(!process.env.GITLAB_URL || !process.env.ACCESS_TOKEN || !process.env.REPO) {
  throw new Error('you should define environments (GITLAB_URL, ACCESS_TOKEN, REPO) before running tests')
}

const expect = chai.expect
const should = chai.should()
const options = {
  url: process.env.GITLAB_URL,
  token: process.env.ACCESS_TOKEN,
  repo: process.env.REPO,
}
const testDbName = 'flame'
const testCollectionName = 'project'
const testCollectionDocuments = [{ a: 1, b: 3 }, { a: 2, d: 3, b: 3 }, { a: 11, b: 22, c: 33, d: 44 }]
const collectionsWillBeCreatedAndRemoved = ['project4', 'project5']
const newDocument = { a: 41, b: 42 }
const newDocuments = [{ a: 41, b: 42 }, { a: 51, b: 52 }, { a: 53, b: 54 }]
const gitlabDB = new GitLabDB(testDbName, options)

describe('GitLabDB', function() {
  this.timeout(200000)

  before(async () => {
    console.log(`Creating ${testDbName}/${testCollectionName}.json file in the test repo: ${options.repo}...`)
    const isExists = await gitlabDB.isCollectionExists(testCollectionName)
    if (!isExists) {
      const data = await gitlabDB.createCollection(testCollectionName, testCollectionDocuments)
      expect(data).to.have.a.property('file_path')
    }
  })

  it('collection already exists, should createCollection failed', () => {
    return gitlabDB.createCollection(testCollectionName, [], { key: 'a' }).catch((e) => {
      expect(e).to.be.an('error')
    })
  })

  it('should create collections passed', (done) => {
    expect(gitlabDB.createCollections(collectionsWillBeCreatedAndRemoved, [[{a: 1}], [{a: 2}]])).eventually.to.be.an('array').notify(done)
  })

  it('should save passed', (done) => {
    expect(gitlabDB.collection('project4').save(newDocument)).eventually.to.have.a.property('added', 1).notify(done)
  })

  it('should batch saving passed', (done) => {
    expect(gitlabDB.collection('project4', { key: 'a' }).save(newDocuments)).eventually.to.have.a.property('added', 2).notify(done)
  })

  it('should return {added: 0} while saving a document that the key points to already exists', (done) => {
    expect(gitlabDB.collection('project4', { key: 'a' }).save(newDocument)).eventually.to.eql({ added: 0 }).notify(done)
  })

  it('should remove passed', (done) => {
    expect(gitlabDB.collection('project4').remove(newDocument)).eventually.to.have.a.property('removed').notify(done)
  })

  it('should return {updated: 0} while updating a non-existent document', (done) => {
    expect(gitlabDB.collection('project4').update({a: 9999}, {d: 44})).eventually.to.eql({ updated: 0 }).notify(done)
  })

  it('should update passed', (done) => {
    expect(gitlabDB.collection('project4').update({a: 51}, {d: 44})).eventually.to.eql({ updated: 1 }).notify(done)
  })

  it('should batch update passed', (done) => {
    const updates = [{ query: {a: 51}, update: {d: 45} }, { query: {a: 53}, update: {d: 54} }]
    expect(gitlabDB.collection('project4').update(updates)).eventually.to.eql({ updated: 2 }).notify(done)
  })

  it('should find passed', (done) => {
    expect(gitlabDB.collection('project4').find({a: 1})).eventually.to.be.an('array').notify(done)
  })

  it('should isCollectionExists passed', (done) => {
    expect(gitlabDB.isCollectionExists('project4')).eventually.to.equal(true).notify(done)
  })

  after((done) => {
    console.log('Get all tests be done, cleaning generated files...')
    cleanRepositry(collectionsWillBeCreatedAndRemoved, { ...options, dbName: testDbName }).then(() => {
      const removed_files = collectionsWillBeCreatedAndRemoved.map(item => `${testDbName}/${item}`).join(', ')
      console.log(`${removed_files} has been removed`)
      done()
    })
  })
})