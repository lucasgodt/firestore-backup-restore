import * as admin from 'firebase-admin';

/**
 * Get data from all collections
 * Suggestion from jcummings2 and leningsv
 * @param {Array<string>} collectionNameArray
 */
export var getAllCollections = (collectionNameArray): Promise<any> => {
  const db = admin.firestore();
  // get all the root-level paths
  return new Promise(resolve => {
    db.listCollections().then(snap => {
      let paths = collectionNameArray;

      if (paths.length === 0) {
        // get all collections
        snap.forEach(collection => paths.push(collection.path));
      }

      // fetch in parallel
      let promises = [];
      paths.forEach(segment => {
        let result = backup(segment);
        promises.push(result);
      });
      // assemble the pieces into one object
      Promise.all(promises).then(value => {
        let all = Object.assign({}, ...value);
        resolve(all);
      });
    });
  });
};

/**
 * Backup data from firestore
 *
 * @param {string} collectionName
 * @returns {Promise<any>}
 */
export var backup = async (collectionName: string): Promise<any> => {
  try {
    const db = admin.firestore();
    let data = {};
    data[collectionName] = {};

    var documents = await db.collection(collectionName).get();

    for (var doc of documents.docs) {
      var subCollections = await doc.ref.listCollections();

      data[collectionName][doc.id] = doc.data();

      for (var subCol of subCollections) {
        var subColData = await backup(
          `${collectionName}/${doc.id}/${subCol.id}`
        );
        data[collectionName][doc.id][subCol.id] = subColData;
      }
    }

    return data;
  } catch (error) {
    console.error(error);
    throw new Error(error);
  }
};
