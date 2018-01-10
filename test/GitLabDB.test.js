import assert from 'assert'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import cleanRepositry from './cleanRepositry'
import GitLabDB from '../dist/main'

chai.use(chaiAsPromised)

const expect = chai.expect
const should = chai.should()
const options = {
  url: process.env.GITLAB_URL,
  token: process.env.ACCESS_TOKEN,
  repo: process.env.REPO,
}
const testDbName = 'flame'
const testCollectionName = 'project'
const testCollectionContent = [{"a":1,"b":3},{"a":1,"d":3,"b":3},{"a":11,"b":22,"c":33,"d":44}]
const collectionsWillBeCreatedAndRemoved = ['project4', 'project5']
const newProject = {
  a: 41,
  b: 42,
}
const gitlabDB = new GitLabDB(testDbName, options)

describe('GitLabDB', function() {
  this.timeout(200000)

  before((done) => {
    console.log(`Creating ${testDbName}/${testCollectionName}.json file in the test repo: ${options.repo}...`)
    gitlabDB.isCollectionExists(testCollectionName).then((result) => {
      if (!result) {
        gitlabDB.createCollection(testCollectionName, testCollectionContent).then((data) => {
          expect(data).to.have.a.property('file_path')
          done()
        })
      } else {
        done()
      }
    })
  })

  beforeEach((done) => {
    if(!process.env.GITLAB_URL || !process.env.ACCESS_TOKEN || !process.env.REPO) {
      console.warn('you should define environments (GITLAB_URL, ACCESS_TOKEN, REPO) before running tests')
    }
    done()
  })

  it('should create collection failed', (done) => {
    gitlabDB.createCollection(testCollectionName).catch((e) => {
      expect(e).to.be.an('error')
      done()
    })
  })

  it('should create collections passed', (done) => {
    expect(gitlabDB.createCollections(collectionsWillBeCreatedAndRemoved, [[{a: 1}], [{a: 2}]])).eventually.to.be.an('array').notify(done)
  })

  it('should save passed', (done) => {
    expect(gitlabDB.collection(testCollectionName).save(newProject)).eventually.to.eql({ added: 1 }).notify(done)
  })

  it('should remove passed', (done) => {
    expect(gitlabDB.collection(testCollectionName).remove(newProject)).eventually.to.have.a.property('removed').notify(done)
  })

  it('should update passed', (done) => {
    expect(gitlabDB.collection(testCollectionName).update({a: 11}, {d: 44})).eventually.to.have.a.property('updated').notify(done)
  })

  it('should find passed', (done) => {
    expect(gitlabDB.collection(testCollectionName).find({a: 1})).eventually.to.be.an('array').notify(done)
  })

  it('should isCollectionExists passed', (done) => {
    expect(gitlabDB.isCollectionExists(testCollectionName)).eventually.to.equal(true).notify(done)
  })

  after((done) => {
    console.log('Get all tests be done, cleaning generated files...')
    cleanRepositry(collectionsWillBeCreatedAndRemoved, { ...options, dbName: testDbName }).then((data) => {
      const removed_files = data.map(item => {
        return JSON.parse(item).file_path
      }).join(', ')
      console.log(`${removed_files} has been removed`)
      done()
    })
  })
})