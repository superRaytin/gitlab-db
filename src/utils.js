import uuidv1 from 'uuid/v1'

export function newId() {
  return uuidv1().replace(/-/g, '')
}

export function newRecord(data) {
  return {
    ...data,
    _id: newId(),
    createdTime: Date.now(),
  }
}

export function newCollection(collection) {
  return collection.map(item => newRecord(item))
}

export function updateModifiedTime(data) {
  return {
    ...data,
    modifiedTime: Date.now(),
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
