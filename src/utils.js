import { v1 as uuidv1 } from 'uuid'

export function createNewId() {
  return uuidv1().replace(/-/g, '')
}

export function initializeDocument(data) {
  return {
    ...data,
    _id: createNewId(),
    _createdTime: Date.now(),
  }
}

export function initializeCollection(collection) {
  return collection.map(item => initializeDocument(item))
}

export function updateModifiedTime(data) {
  return {
    ...data,
    _modifiedTime: Date.now(),
  }
}

export function promiseAllSerial(promises, fn) {
  let filterFn = fn
  if (fn === undefined) {
    filterFn = (p) => p()
  }
  const results = []
  /* eslint-disable arrow-body-style */
  return promises.reduce((p, currentPromise) => {
    return p.then(() => {
      return filterFn(currentPromise).then((data) => {
        results.push(data)
        return results
      })
    })
  }, Promise.resolve())
}
