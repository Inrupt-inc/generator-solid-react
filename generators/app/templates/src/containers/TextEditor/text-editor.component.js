/* eslint-disable constructor-super */
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TextEditorWrapper, TextEditorContainer, Header, Form, FullGridSize, Button, Label, Input, TextArea, WebId } from './text-editor.style';
import SolidAuth from 'solid-auth-client';
import { successToaster, errorToaster } from '@utils';
import LinkHeader from 'http-link-header';
import { fetchDocument, createDocument } from 'tripledoc';
import { AccessControlList } from '@inrupt/solid-react-components';
import { useWebId } from '@solid/react';

const pim = { storage: 'http://www.w3.org/ns/pim/space#storage' };

// copied from https://gitlab.com/vincenttunru/tripledoc/blob/master/src/document.ts#L115-126

function extractAclRef(response, documentRef) {
  let aclRef;
  const linkHeader = response.headers.get('Link');
  if (linkHeader) {
    const parsedLinks = LinkHeader.parse(linkHeader);
    const aclLinks = parsedLinks.get('rel', 'acl');
    if (aclLinks.length === 1) {
      aclRef = new URL(aclLinks[0].uri, documentRef).href;
    }
  }
  if (!aclRef) {
    aclRef = documentRef + '.acl';
  }
  return aclRef;
}

function extractWacAllow(response) {
  // WAC-Allow: user="read write append control",public="read"
  let modes = {
    user: {
      read: false,
      append: false,
      write: false,
      control: false
    },
    public: {
      read: false,
      append: false,
      write: false,
      control: false
    }
  };
  const wacAllowHeader = response.headers.get('WAC-Allow');
  if (wacAllowHeader) {
    wacAllowHeader // 'user="read write append control",public="read"'
      .split(',') // ['user="read write append control"', 'public="read"']
      .map(str => str.trim())
      .forEach(statement => { // 'user="read write append control"'
         const parts = statement.split('='); // ['user', '"read write control"']
         if (parts.length >= 2 && ['user', 'public'].indexOf(parts[0]) !== -1 && parts[1].length > 2) {
           const modeStr = parts[1].replace(/"/g, ''); // 'read write control' or ''
           if (modeStr.length) {
            modeStr.split(' ').forEach(mode => {
              modes[parts[0]][mode] = true; 
            });
          }
        }
      });
  }
  return modes;
}

export const Editor = (props) => {
  const { t } = useTranslation();
  const [url, setUrl] = useState('');
  const [aclUrl, setAclUrl] = useState('');
  const [friend, setFriend] = useState('https://example-friend.com/profile/card#me');
  const [text, setText] = useState('');
  const [profileDoc, setProfileDoc] = useState();
  const webId = useWebId();
  useEffect(() => {
    async function fetchProfileDoc () {
      if (webId) {
        setProfileDoc(await fetchDocument(webId));
      }
    }
    fetchProfileDoc();
  }, [webId]);
  useEffect(() => {
    if (profileDoc && !url) {
      const sub = profileDoc.getSubject(webId);
      const storageRoot = sub.getNodeRef(pim.storage);
      if (storageRoot) {
        const exampleUrl = new URL('/share/some-doc.txt', storageRoot);
        setUrl(exampleUrl.toString());
        setAclUrl(exampleUrl.toString() + '.acl');
      }
    }
  }, [profileDoc]);

  const [loaded, setLoaded] = useState(false);
  const [editable, setEditable] = useState(false);
  const [sharable, setSharable] = useState(false);

  function handleUrlChange(event) {
    event.preventDefault();
    setUrl(event.target.value);
  }

  function handleFriendChange(event) {
    event.preventDefault();
    setFriend(event.target.value);
  }

  function handleTextChange(event) {
    event.preventDefault();
    setText(event.target.value);
  }

  function handleLoad(event) {
    event.preventDefault();
    const doc = SolidAuth.fetch(url);
    doc.then(async (response) => {
      const text = await response.text();
      if (response.ok) {
        setText(text);
      } else if (response.status === 404) {
        successToaster(t('notifications.404'));
      } else {
        errorToaster(t('notifications.errorLoading'));
      }
      const wacAllowModes = extractWacAllow(response);
      setEditable(wacAllowModes.user.write);
      setSharable(wacAllowModes.user.control);
      setAclUrl(extractAclRef(response, url));
      setLoaded(true);
    }).catch((e) => {
      errorToaster(t('notifications.errorFetching'));
    });
  } // assuming the logged in user doesn't change without a page refresh

  async function handleShare(event) {
    event.preventDefault();
    try {
      const permissions = [
        {
          agents: [friend],
          modes: [AccessControlList.MODES.READ, AccessControlList.MODES.WRITE]
        }
      ];
      const ACLFile = new AccessControlList(webId, url);
      await ACLFile.createACL(permissions);
      successToaster(t('notifications.accessGranted'));
    } catch (e) {
      errorToaster(t('notifications.errorGrantingAccess'));
    }
  }

  async function handleSave(event) {
    event.preventDefault();
    // Not using TripleDoc or LDFlex here, because this is not an RDF document.
    const result = await SolidAuth.fetch(url, {
      method: 'PUT',
      body: text,
      headers: {
        'Content-Type': 'text/plain'
      }
    });

    if (result.ok) {
      successToaster(t('notifications.saved'));
    } else if(result.ok === false) {
      errorToaster(t('notifications.errorSaving'));
    }
  }

  return (
    <Form>
      <FullGridSize>
        <WebId><b>Connected as: <a href={webId}>{webId}</a></b></WebId>
      </FullGridSize>
      <FullGridSize>
        <Label>
          {t('editor.url')}:
          <Input type="text" size="200" value={url} onChange={handleUrlChange} />
        </Label>
        <div class="input-wrap">
          <Button className="ids-link-filled ids-link-filled--primary button" onClick={handleLoad}>{t('editor.load')</Button>
          {editable ?
            <Button className="ids-link-filled ids-link-filled--secondary button" onClick={handleSave}>t('editor.save')</Button>
          : (loaded ? t('notifications.notEditable') : '')}
        </div>
      </FullGridSize>
      <FullGridSize>
        <TextArea value={text} onChange={handleTextChange} cols={40} rows={10} />
      </FullGridSize>
      {sharable ? <FullGridSize>
        <Label>
          {t('editor.friend')}:
          <Input type="text" size="200" value={friend} onChange={handleFriendChange} />
        </Label>
        <Button className="ids-link-stroke ids-link-stroke--primary button" onClick={handleShare}>{t('editor.grantAccess')}</Button>
      </FullGridSize>: t('notifications.notSharable')}
    </Form>
  );
}

/**
 * A React component page that is displayed when there's no valid route. Users can click the button
 * to get back to the home/welcome page.
 */
const TextEditor = () => {
  return (
    <TextEditorWrapper>
      <TextEditorContainer>
        <Header>
          <p>
          t('editor.explanation')
          </p>
        </Header>
        <Editor/>
      </TextEditorContainer>
    </TextEditorWrapper>
  );
};

export default TextEditor;
