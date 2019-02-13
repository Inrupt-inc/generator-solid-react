import React, { Component } from "react";
import { namedNode } from "@rdfjs/data-model";
import { withWebId } from "@inrupt/solid-react-components";
import { withToastManager } from "react-toast-notifications";
import data from "@solid/query-ldflex";
import ProfileShape from "@contexts/profile-shape.json";
import ProfileComponent from "./profile.component";

const defaulProfilePhoto = "/img/icon/empty-profile.svg";

/**
 * We are using ldflex to fetch profile data from a solid pod.
 * ldflex libary is using json-LD for this reason you will see async calls
 * when we want to get a field value, why ? becuase they are expanded the data
 * this means the result will have a better format to read on Javascript.
 * for more information please go to: https://github.com/solid/query-ldflex
 */

export class Profile extends Component {
  constructor(props) {
    super(props);

    this.state = {
      formFields: [],
      originalFormField: [],
      formMode: true,
      photo: defaulProfilePhoto,
      isLoading: false,
      newLinkNodes: []
    };
  }
  async componentDidMount() {
    this.setState({ isLoading: true });
    await this.fetchPhoto();
    await this.fetchProfile();
    this.setState({ isLoading: false });
  }

  changeFormMode = () => {
    this.setState({ formMode: !this.state.formMode });
  };
  setDefaultData = () => {
    this.setState({ formFields: [...this.state.originalFormField] });
  };
  onCancel = () => {
    this.changeFormMode();
    this.setDefaultData();
  };
  changeInputMode = (currentValue: String, nextValue: String, currentAction: String) => {
    if (currentValue !== '' && nextValue === '') {
      return 'delete';
    } else if (nextValue !== '' && (currentAction === 'delete' || currentAction === 'update')) {
      return 'update';
    }

    return 'create';
  };
  /**
   * onChangeInput will update a field into formFields array
   * and will add updated flag to true, this will be taken
   * for submit form to check which fields needs to be sent to POD
   */
  onInputChange = (e: Event) => {
    const name = e.target.name;
    const value = e.target.value;

    const updatedFormField = this.state.formFields.map(field => {
      if (field.property === name || field.blankNode === name) {
        return {
          ...field,
          action: this.changeInputMode(field.value, value, field.action),
          updated: true,
          value
        };
      }

      return { ...field };
    });

    this.setState({ formFields: updatedFormField });
  };
  /**
   * onSubmit will send all the updated fields to POD
   * fields that was not updated will be not send it.
   */
  onSubmit = async (e: Event) => {
    try {
      e.preventDefault();
      let node;
      let nextAction;
      const updatedFormField = await Promise.all(
        this.state.formFields.map(async field => {
          if (field.updated) {
            node = data.user[field.property];
            nextAction = 'update';

            if (field.blankNode) {
              node = data[field.nodeParentUri][field.blankNode];
            }

            if (field.action === 'update') {
              await node.set(field.value);
            } else if (field.action === 'create') {
              await node.add(field.value);
            } else {
              await node.delete();
              nextAction = 'create';
            }

            return {
              ...field,
              action: nextAction,
              updated: false
            };
          }
          return { ...field };
        })
      );
      this.props.toastManager.add(['','Profile was updated successfully'], {
        appearance: 'success'
      });
      this.setState({
        formFields: updatedFormField,
        originalFormField: updatedFormField,
        formMode: true
      });
    } catch (error) {
      this.props.toastManager.add(['Error', error.message], { appearance: 'error' });
    }
  };
  /**
   * Fetch profile photo from card
   */
  fetchPhoto = async () => {
    try {
      // We are fetching profile card document
      const user = data[this.props.webId];
      // We access to document node using a node name
      let image = await user.image;
      let hasImage = true;
      // If image is not present on card we try with hasPhoto
      if (!image) {
        /**
         * hasPhoto is a new context that ldflex doesn't having
         * we need to add it manually.
         * if you want to know more about context please go to:
         * https://github.com/digitalbazaar/jsonld.js
         */
        image = await user['vcard:hasPhoto'];

        hasImage = false;
      }

      this.setState({
        photo: (image && image.value) || defaulProfilePhoto,
        hasImage
      });
    } catch (error) {
      this.props.toastManager.add(['Error', error.message], { appearance: 'error' });
    }
  };
  /**
   * updatedPhoto will update the photo url on vcard file
   * this function will check if user has image or hasPhoto node if not
   * will just update it, the idea is use image instead of hasPhoto
   * @params{String} uri photo url
   */
  updatePhoto = async (uri: String) => {
    try {
      const { user } = data;
      this.state.hasImage
        ? await user.image.set(uri)
        : await user.image.add(uri);

      this.props.toastManager.add('Profile Image was updated', {
        appearance: 'success'
      });
    } catch (error) {
      this.props.toastManager.add(['Error', error.message], { appearance: 'error' });
    }
  };
  /**
   * Fetch Profile Shape data
   */
  fetchProfile = async () => {
    try {
      /**
       * We fetch profile shape from context/profile-shape.json
       * profile-shape.json has all the fields that we want to print
       * we are using icons on each field to mapping with the UI design.
       */
      const { profile } = ProfileShape;
      // We are fetching profile card document
      const user = data[this.props.webId];

      /**
       * We run each shapes on profile-shape.json and access to each
       * field value, in case that node field value point to another
       * node blank we acces using multidimensional array if not we
       * access by a basic array.
       */
      const formFields = await Promise.all(
        profile.map(async field => {
          return {
            ...field,
            ...(await this.getNodeValue(user, field))
          };
        })
      );
      this.setState({ profile, formFields, originalFormField: formFields });
    } catch (error) {
      this.props.toastManager.add(['Error', error.message], { appearance: 'error' });
    }
  };
  /**
   * Create a new node link on vcard document.
   * @params{String} property
   * Property param will be the name of node
   */
  createNewLinkNode = async (property: String) => {
    const id = `#id${Date.parse(new Date())}`;
    await data.user[property].add(namedNode(id));
    // @TODO: add from ldflex should return this value instead of create by our self
    return `${this.props.webId.split('#')[0]}${id}`;
  };
  /**
   * getNodeValue will return node value and uri in case that node points to nodeBlank
   * nodeParentUri is a workaround to fix blank node update fields on ldflex
   * @params{Object} user
   * @params{Object} field
   */
  getNodeValue = async (user: Object, field: Object) => {
    let node;
    let nodeParentUri;
    // If node is a pointer to another node will get the value
    if (field.blankNode) {
      let parentNode = await user[field.property];
      // If the node link doesn't exist will create a new one.
      nodeParentUri =
        (parentNode && parentNode.value) ||
        (await this.createNewLinkNode(field.property));

      node = await user[field.property][field.blankNode];
    } else {
      node = await user[field.property];
    }

    const nodeValue = node && node.value;

    return {
      action: nodeValue ? 'update' : 'create',
      value: nodeValue || '',
      nodeParentUri
    };
  };
  render() {
    return (
      <ProfileComponent
        webId={this.props.webId}
        formFields={this.state.formFields}
        formMode={this.state.formMode}
        onInputChange={this.onInputChange}
        onSubmit={this.onSubmit}
        onCancel={this.onCancel}
        updatePhoto={this.updatePhoto}
        photo={this.state.photo}
        changeFormMode={this.changeFormMode}
        isLoading={this.state.isLoading}
        toastManager={this.props.toastManager}
      />
    );
  }
}

export default withWebId(withToastManager(Profile));
