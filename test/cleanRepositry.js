import { promiseAllSerial } from '../src/utils'
const child_process = require('child_process')

export default function cleanRepositry(collectionNames, options) {
  const { token, url, repo, dbName } = options
  const promises = collectionNames.map((collectionName, index) => () => {
    return new Promise((resolve, reject) => {
      child_process.exec(`curl --request DELETE --header "PRIVATE-TOKEN: ${token}" "${url}/api/v3/projects/${encodeURIComponent(repo)}/repository/files?file_path=${dbName}%2F${collectionName}%2Ejson&branch_name=master&commit_message=Delete%20collection"`, (error, stdout) => {
        if(error) {
          console.error('error: ' + error);
          return reject(error)
        }
        resolve(stdout)
      });
    })
  })
  return promiseAllSerial(promises)
}