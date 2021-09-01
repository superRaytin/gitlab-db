import { promiseAllSerial } from '../src/utils'
const child_process = require('child_process')

export default function cleanRepositry(collectionNames, options) {
  const { token, url, repo, dbName } = options
  const promises = collectionNames.map((collectionName, index) => () => {
    return new Promise((resolve) => {
      child_process.exec(`curl --request DELETE --header 'PRIVATE-TOKEN: ${token}' --header "Content-Type: application/json" --data '{"branch": "main", "author_email": "shiliang@dxy.cn", "author_name": "shiliang", "commit_message": "Delete collection"}' "${url}/api/v4/projects/shiliang%2Fgitlab-db/repository/files/${dbName}%2F${collectionName}%2Ejson"`, (error, stdout) => {
        if(error) {
          console.log(`[${collectionName}] error: ` + error);
        }
        resolve(stdout)
      });
    })
  })
  return promiseAllSerial(promises)
}