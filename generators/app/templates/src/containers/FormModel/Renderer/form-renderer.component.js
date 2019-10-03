import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FormModel } from '@inrupt/solid-react-components';
import { Select, Loader } from '@util-components';

import { RendererTypesList, ConverterTypes } from '@constants';
import {
  FormModelContainer,
  FormWrapper,
  Form,
  Input,
  Result,
  ResultHeader,
  Button,
  ConverterInput
} from '../form-model.style';

/**
 * Form Model Renderer UI component, containing the styled components for the Form Model Converter
 * @param props
 */
const FormModelRenderer = () => {
  const { t } = useTranslation();
  const [schemaUrl, setSchemaUrl] = useState('');
  const [layoutUrl, setLayoutUrl] = useState('');
  const [selectedInput, setSelectedInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [layoutText, setLayoutText] = useState(t('formLanguage.extension'));
  const [shapeText, setShapeText] = useState(t('formLanguage.source'));
  const [source, setSource] = useState('');
  const [hasLayoutFile, setHasLayoutFile] = useState('');
  const [isViewMode, setViewMode] = useState(true);

  const filteredOptions = RendererTypesList.filter(
    item =>
      t(`formLanguage.${item}`) === t('formLanguage.shex') ||
      t(`formLanguage.${item}`) === t('formLanguage.formModel')
  );
  const optionsList = filteredOptions.map(item => t(`formLanguage.${item}`));

  /**
   * Helper function to detect if choice is ShEx
   * @param value
   * @returns {boolean}
   */
  const isShEx = value =>
    value === t(`formLanguage.${ConverterTypes.Shex}`) ||
    value === t(`formLanguage.${ConverterTypes.ShexLayout}`);

  /**
   * Helper function to detect if choice is SHACL
   * @param value
   * @returns {boolean}
   */
  const isShacl = value =>
    value === t(`formLanguage.${ConverterTypes.Shacl}`) ||
    value === t(`formLanguage.${ConverterTypes.ShaclExtension}`);

  /**
   * Helper function to detect if choice has a layout or extension or not
   * @param value
   * @returns {boolean}
   */
  const hasLayout = value =>
    value === t(`formLanguage.${ConverterTypes.ShaclExtension}`) ||
    value === t(`formLanguage.${ConverterTypes.ShexLayout}`);

  /**
   * Change event for the shape/schema URL field
   */
  const onSchemaChange = useCallback((e: Event) => {
    setSchemaUrl(e.target.value);
  });

  /**
   * Change event for layout/extension URL field
   */
  const onLayoutChange = useCallback((e: Event) => {
    setLayoutUrl(e.target.value);
  });

  /**
   * Submit function for the form, to do the conversion and set up the output
   * This function is for the view button
   */
  const onViewSubmit = useCallback((e: Event) => {
    e.preventDefault();
    console.log('Submitted View!', e); // eslint-disable-line no-console
    setViewMode(true);
  });

  /**
   * Submit function for the form, to do the conversion and set up the output
   * This function is for the edit button
   */
  const onEditSubmit = useCallback((e: Event) => {
    e.preventDefault();
    console.log(schemaUrl, source);
    console.log('Submitted Edit!', e); // eslint-disable-line no-console
    setViewMode(false);
  });

  const resetModel = useCallback(() => {
    setViewMode(true);
  });

  /**
   * Change event for the source
   */
  const onSourceChange = useCallback((e: Event) => {
    setSource(e.target.value);
  });

  /**
   * Change event for the input list change, setting up the form conditions
   */
  const onListChange = useCallback((e: Event) => {
    const newValue = e.target.value;

    // Set the label for the label or extension field
    if (isShEx(newValue)) {
      setLayoutText(t('formLanguage.layout'));
      setShapeText(t('formLanguage.shexShape'));
    } else if (isShacl(newValue)) {
      setLayoutText(t('formLanguage.extension'));
      setShapeText(t('formLanguage.shaclShape'));
    } else {
      setLayoutText(t('formLanguage.extension'));
      setShapeText(t('formLanguage.source'));
    }

    // Set boolean to disable or enable the layout/extension textbox
    setHasLayoutFile(hasLayout(newValue));
    setSelectedInput(newValue);
  });

  return (
    <FormModelContainer>
      <FormWrapper>
        <Form onSubmit={onViewSubmit}>
          <h3>{t('formLanguage.renderer.title')}</h3>
          <ConverterInput>
            <label htmlFor="selected-filter">{t('formLanguage.input')}</label>
            <Select
              name="selected-filter"
              id="selected-filter"
              options={optionsList}
              onChange={onListChange}
            />
          </ConverterInput>
          <ConverterInput>
            <label htmlFor="converter-input">{shapeText}</label>
            <Input
              type="text"
              placeholder={shapeText}
              name="converter-input"
              id="converter-input"
              onChange={onSchemaChange}
              value={schemaUrl}
            />
          </ConverterInput>
          <ConverterInput>
            <label htmlFor="layout-input">{layoutText}</label>
            <Input
              type="text"
              placeholder={layoutText}
              onChange={onLayoutChange}
              value={layoutUrl}
              name="layout-input"
              id="layout-input"
            />
          </ConverterInput>
          <ConverterInput>
            <label htmlFor="converter-input">{t('formLanguage.source')}</label>
            <Input
              type="text"
              placeholder={t('formLanguage.source')}
              name="converter-input"
              id="converter-input"
              onChange={onSourceChange}
              value={source}
            />
          </ConverterInput>
          <Button type="submit" disabled={!(schemaUrl !== '')}>
            View
          </Button>
          <Button type="submit" onClick={onEditSubmit} disabled={!(schemaUrl !== '')}>
            Edit
          </Button>
        </Form>
        {isViewMode !== null && (
          <Result>
            <ResultHeader>
              <h4>{t('formLanguage.formModel')}</h4>
              <button type="button" onClick={resetModel}>
                Reset Model
              </button>
            </ResultHeader>
            {/* TODO: Create forms and insert here */}
            {isViewMode === true && <div>View Form</div>}
            {isViewMode === false && <div>Edit Form</div>}
          </Result>
        )}
        {schemaUrl && source && (
          <FormModel
            modelPath={schemaUrl}
            podPath={source}
            viewer={isViewMode}
            onInit={() => setIsLoading(true)}
            onLoaded={() => setIsLoading(false)}
            settings={{
              theme: {
                inputText: 'input-wrap',
                inputCheckbox: 'sdk-checkbox',
                form: 'inrupt-sdk-form',
                childGroup: 'inrupt-form-group'
              }
            }}
            autoSave
          />
        )}
        { isLoading && <Loader absolute /> }
      </FormWrapper>
    </FormModelContainer>
  );
};

export default FormModelRenderer;
