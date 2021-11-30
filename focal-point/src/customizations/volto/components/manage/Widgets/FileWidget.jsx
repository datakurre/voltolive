/**
 * FileWidget component.
 * @module components/manage/Widgets/FileWidget
 */

import React, { Component, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Button, Image, Dimmer } from 'semantic-ui-react';
import { readAsDataURL } from 'promise-file-reader';
import { injectIntl } from 'react-intl';
import deleteSVG from '@plone/volto/icons/delete.svg';
import { Icon, FormFieldWrapper } from '@plone/volto/components';
import loadable from '@loadable/component';
import { flattenToAppURL } from '@plone/volto/helpers';
import { defineMessages, useIntl } from 'react-intl';
import { Focuspoint } from "focuspoint";

import "focuspoint/dist/focuspoint.css";

//                className="image-preview"
 //               id={`field-${id}-image`}
  //              size="small"
   //             src={imgsrc}


const FocusPointWidget = ({className, id, size, src, onChange, value}) => {
    const viewRef = useRef();
    const editRef = useRef();
    const buttonRef = useRef();

    useEffect(() => {
      if (!!viewRef?.current && !!editRef?.current && !!buttonRef?.current) {
        new Focuspoint.Edit(editRef.current, {
          view_elm: viewRef.current,
          button_elm: buttonRef.current,
          x: value?.x ?? 0.5,
          y: value?.y ?? 0.5,
        }).on("drag:end", function(x, y) {
          console.log(x, y)
          onChange("focalpoint", JSON.stringify({x, y}));
        });
      }
    }, [viewRef.current, editRef.current, buttonRef.current]);
    console.log(src);

    return ( 
      <figure ref={viewRef} style={{
          width: "300px",
          height: "300px",
          border: "1px solid #ccc",
          position: "relative",
          backgroundImage: `url(${src})`
        }}
        className="lfy-focuspoint-view">
         <div ref={editRef} className="lfy-focuspoint-edit">
           <div ref={buttonRef} className="lfy-focuspoint-button"></div>
         </div>
     </figure>);
};

const imageMimetypes = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/jpg',
  'image/gif',
  'image/svg+xml',
];
const Dropzone = loadable(() => import('react-dropzone'));

const messages = defineMessages({
  releaseDrag: {
    id: 'Drop files here ...',
    defaultMessage: 'Drop files here ...',
  },
  editFile: {
    id: 'Drop file here to replace the existing file',
    defaultMessage: 'Drop file here to replace the existing file',
  },
  fileDrag: {
    id: 'Drop file here to upload a new file',
    defaultMessage: 'Drop file here to upload a new file',
  },
  replaceFile: {
    id: 'Replace existing file',
    defaultMessage: 'Replace existing file',
  },
  addNewFile: {
    id: 'Choose a file',
    defaultMessage: 'Choose a file',
  },
});

/**
 * FileWidget component class.
 * @function FileWidget
 * @returns {string} Markup of the component.
 */
const FileWidget = (props) => {
  const { id, value, onChange } = props;
  const [fileType, setFileType] = React.useState(false);
  const intl = useIntl();

  React.useEffect(() => {
    if (value && imageMimetypes.includes(value['content-type'])) {
      setFileType(true);
    }
  }, [value]);

  const imgsrc = value?.download
    ? `${flattenToAppURL(value?.download)}?id=${Date.now()}`
    : null || value?.data
    ? `data:${value['content-type']};${value.encoding},${value.data}`
    : null;

  /**
   * Drop handler
   * @method onDrop
   * @param {array} files File objects
   * @returns {undefined}
   */
  const onDrop = (files) => {
    const file = files[0];
    readAsDataURL(file).then((data) => {
      const fields = data.match(/^data:(.*);(.*),(.*)$/);
      onChange(id, {
        data: fields[3],
        encoding: fields[2],
        'content-type': fields[1],
        filename: file.name,
      });
    });

    let reader = new FileReader();
    reader.onload = function () {
      const fields = reader.result.match(/^data:(.*);(.*),(.*)$/);
      if (imageMimetypes.includes(fields[1])) {
        setFileType(true);
        let imagePreview = document.getElementById(`field-${id}-image`);
        imagePreview.src = reader.result;
      } else {
        setFileType(false);
      }
    };
    reader.readAsDataURL(files[0]);
  };

  return (
    <FormFieldWrapper {...props}>
      <Dropzone onDrop={onDrop} noClick={true}>
        {({ getRootProps, getInputProps, isDragActive }) => (
          <div className="file-widget-dropzone" {...getRootProps()}>
            {isDragActive && <Dimmer active></Dimmer>}
            {fileType ? (
              <FocusPointWidget
                className="image-preview"
                id={`field-${id}-image`}
                size="small"
                src={imgsrc}
                value={props.formData.focalpoint}
                onChange={onChange}
              />
            ) : (
              <div className="dropzone-placeholder">
                {isDragActive ? (
                  <p className="dropzone-text">
                    {intl.formatMessage(messages.releaseDrag)}
                  </p>
                ) : value ? (
                  <p className="dropzone-text">
                    {intl.formatMessage(messages.editFile)}
                  </p>
                ) : (
                  <p className="dropzone-text">
                    {intl.formatMessage(messages.fileDrag)}
                  </p>
                )}
              </div>
            )}

            <label className="label-file-widget-input">
              {value
                ? intl.formatMessage(messages.replaceFile)
                : intl.formatMessage(messages.addNewFile)}
            </label>
            <input
              {...getInputProps({
                type: 'file',
                style: { display: 'none' },
              })}
              id={`field-${id}`}
              name={id}
              type="file"
            />
          </div>
        )}
      </Dropzone>
      <div className="field-file-name">
        {value && value.filename}
        {value && (
          <Button
            icon
            basic
            className="delete-button"
            aria-label="delete file"
            onClick={() => {
              onChange(id, null);
              setFileType(false);
            }}
          >
            <Icon name={deleteSVG} size="20px" />
          </Button>
        )}
      </div>
    </FormFieldWrapper>
  );
};

/**
 * Property types.
 * @property {Object} propTypes Property types.
 * @static
 */
FileWidget.propTypes = {
  id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  required: PropTypes.bool,
  error: PropTypes.arrayOf(PropTypes.string),
  value: PropTypes.shape({
    '@type': PropTypes.string,
    title: PropTypes.string,
  }),
  onChange: PropTypes.func.isRequired,
  wrapped: PropTypes.bool,
};

/**
 * Default properties.
 * @property {Object} defaultProps Default properties.
 * @static
 */
FileWidget.defaultProps = {
  description: null,
  required: false,
  error: [],
  value: null,
};

export default injectIntl(FileWidget);
