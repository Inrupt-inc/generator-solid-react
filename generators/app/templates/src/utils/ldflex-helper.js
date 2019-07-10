import auth from 'solid-auth-client';
import ldflex from '@solid/query-ldflex';

export const existDocument = async documentUri =>
  auth.fetch(documentUri, {
    headers: {
      'Content-Type': 'text/turtle'
    }
  });

const createDoc = async (documentUri, options) => {
  try {
    return await auth.fetch(documentUri, options);
  } catch (e) {
    throw e;
  }
};

export const createDocument = async (documentUri, body = '') => {
  try {
    const options = {
      method: 'PUT',
      headers: {
        'Content-Type': 'text/turtle'
      },
      body
    };
    return await createDoc(documentUri, options);
  } catch (e) {
    throw e;
  }
};

export const createDocumentWithTurtle = async (documentUri, body = '') => {
  try {
    return createDoc(documentUri, {
      method: 'PUT',
      headers: {
        'Content-Type': 'text/turtle'
      },
      body
    });
  } catch (e) {
    throw e;
  }
};

export const createNonExistentDocument = async (documentUri, body = '') => {
  try {
    const result = await existDocument(documentUri);

    return result.status === 404 ? createDocument(documentUri, body) : null;
  } catch (e) {
    throw e;
  }
};

export const fetchLdflexDocument = async documentUri => {
  try {
    const result = await existDocument(documentUri);
    if (result.status === 404) return null;
    const document = await ldflex[documentUri];
    return document;
  } catch (e) {
    throw e;
  }
};

export const existFolder = async folderPath => {
  const result = await auth.fetch(folderPath);
  return result.ok;
};

export const discoveryInbox = async webId => {
  try {
    const user = await ldflex[webId];
    const inbox = await user['ldp:inbox'];

    return inbox && inbox.value;
  } catch (error) {
    throw error;
  }
};

export const createContainer = async folderPath => {
  try {
    const existContainer = await existFolder(folderPath);
    const data = `${folderPath}data.ttl`;
    if (existContainer) return folderPath;

    await createDoc(data, {
      method: 'PUT',
      headers: {
        'Content-Type': 'text/turtle'
      }
    });
    // await createDoc(dummyPath, { method: 'DELETE' });

    return folderPath;
  } catch (error) {
    throw new Error(error);
  }
};
