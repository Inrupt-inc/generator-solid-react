
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import isLoading from '@hocs/isLoading';
import { Uploader } from '@inrupt/solid-react-components';
import { Input } from '@util-components';
import { ImageProfile } from '@components';
import {
  ProfileWrapper,
  ProfileContainer,
  FullGridSize,
  Button,
  Header,
  Form,
  WebId
} from './profile.style';

type Props = {
  webId: String,
  photo: String,
  formFields: Array<Object>,
  updatedFields: Object,
  changeFormMode: () => void,
  onInputChange: () => void,
  onSubmit: () => void,
  onCancel: () => void,
  updatePhoto: (uri: String) => void,
  toastManager: (message: String, options: Object) => void,
  formMode: boolean
}


function getProfileValue(updatedFields: Object, item: Object) {
  const currentKey = item.nodeBlank || item.property;
  if (updatedFields[currentKey]) {
    if (
      updatedFields[currentKey].value ||
      updatedFields[currentKey].value === ''
    )
      return updatedFields[currentKey].value;
  }
  return item.value || '';
}

const ProfileComponent = ({
  webId,
  formFields,
  changeFormMode,
  onInputChange,
  updatePhoto,
  toastManager,
  onSubmit,
  onCancel,
  formMode,
  updatedFields,
  photo
}: Props) => {
  return (
    <ProfileWrapper data-testid="profile-component">
      <ProfileContainer>
        <Header>
          {formMode && (
            <button
              type='button'
              className='button edit-button'
              onClick={changeFormMode}
              data-testid="edit-profile-button"
            >
              <FontAwesomeIcon icon='pencil-alt' /> EDIT
            </button>
          )}
          <Uploader
            {...{
              fileBase: webId && webId.split('/card')[0],
              limitFiles: 1,
              limitSize: 2100000,
              accept: 'image/*',
              onError: error => {
                if (error && error.statusText) {
                  toastManager.add(['', error.statusText], {
                    appearance: 'error'
                  });
                }
              },
              onComplete: uploadedFiles => {
                updatePhoto(uploadedFiles[0].uri)
              },
              render: props => <ImageProfile {...{ ...props, webId, photo }} />
            }}
          />
        </Header>
        <Form onSubmit={onSubmit}>
          {formFields &&
            formFields.map(item => (
              <Input
                key={item.label}
                placeholder={item.label}
                name={item.nodeBlank || item.property}
                value={getProfileValue(updatedFields, item)}
                onChange={onInputChange}
                icon={item.icon}
                readOnly={formMode}
                required={item.required}
                data-nodeparenturi={item.nodeParentUri}
                data-nodeblank={item.nodeBlank}
                data-label={item.label}
                data-icon={item.icon}
                type={'text'}
              />
            ))}
          <FullGridSize>
            {!formMode && (
              <>
                <Button
                  type='button'
                  onClick={onCancel}
                  className='ids-link-stroke ids-link-stroke--primary'
                >
                  Cancel
                </Button>
                <Button
                  type='submit'
                  className='ids-link-filled ids-link-filled--primary'
                >
                  Save
                </Button>
              </>
            )}
          </FullGridSize>
        </Form>
        {formMode && (
          <WebId>
            <FontAwesomeIcon icon='id-card' />
            <a href={webId} target='_blank' rel='noopener noreferrer'>
              {webId}
            </a>
          </WebId>
        )}
      </ProfileContainer>
    </ProfileWrapper>
  )
}

export default isLoading(ProfileComponent)
