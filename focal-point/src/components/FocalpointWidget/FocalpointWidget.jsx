/**
 * TextWidget component.
 * @module components/manage/Widgets/TextWidget
 */

import React, { Component, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Input } from 'semantic-ui-react';

import { injectIntl } from 'react-intl';
import { Icon, FormFieldWrapper } from '@plone/volto/components';
import { Focuspoint } from "focuspoint";

import "focuspoint/dist/focuspoint.css";

//.lfy-focuspoint-view .lfy-focuspoint-edit {
//  top: 0;
//  right: 0;
//  bottom: 0;
//  left: 0;
//}


const FocusPointWidget = ({id, onChange}) => {
    const viewRef = useRef();
    const editRef = useRef();
    const buttonRef = useRef();

    useEffect(() => {
      if (!!viewRef?.current && !!editRef?.current && !!buttonRef?.current) {
        new Focuspoint.Edit(editRef.current, {
          view_elm: viewRef.current,
          button_elm: buttonRef.current,
        }).on("drag:end", function(x, y) {
          console.log(x, y)
          onChange(id, JSON.stringify({x, y}));
        });
      }
    }, [viewRef.current, editRef.current, buttonRef.current]);

    return ( 
      <figure ref={viewRef} style={{
          width: "300px",
          height: "300px",
          border: "1px solid #ccc",
          position: "relative",
          backgroundImage: "url(https://sneak2.preview.jyu.fi/resolveuid/8cfb184d707c452e9bcfff3b14ac5d48/@@images/image/preview)"
        }}
        className="lfy-focuspoint-view">
         <div ref={editRef} className="lfy-focuspoint-edit">
           <div ref={buttonRef} className="lfy-focuspoint-button"></div>
         </div>
     </figure>);
};

/**
 * TextWidget component class.
 * @class TextWidget
 * @extends Component
 */
class TextWidget extends Component {
  /**
   * Property types.
   * @property {Object} propTypes Property types.
   * @static
   */
  static propTypes = {
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    required: PropTypes.bool,
    error: PropTypes.arrayOf(PropTypes.string),
    value: PropTypes.string,
    focus: PropTypes.bool,
    onChange: PropTypes.func,
    onBlur: PropTypes.func,
    onClick: PropTypes.func,
    onEdit: PropTypes.func,
    onDelete: PropTypes.func,
    icon: PropTypes.shape({
      xmlns: PropTypes.string,
      viewBox: PropTypes.string,
      content: PropTypes.string,
    }),
    iconAction: PropTypes.func,
    minLength: PropTypes.number,
    maxLength: PropTypes.number,
    wrapped: PropTypes.bool,
    placeholder: PropTypes.string,
  };

  /**
   * Default properties.
   * @property {Object} defaultProps Default properties.
   * @static
   */
  static defaultProps = {
    description: null,
    required: false,
    error: [],
    value: null,
    onChange: () => {},
    onBlur: () => {},
    onClick: () => {},
    onEdit: null,
    onDelete: null,
    focus: false,
    icon: null,
    iconAction: null,
    minLength: null,
    maxLength: null,
  };

  /**
   * Component did mount lifecycle method
   * @method componentDidMount
   * @returns {undefined}
   */
  componentDidMount() {
    if (this.props.focus) {
      this.node.focus();
    }
  }

  /**
   * Render method.
   * @method render
   * @returns {string} Markup for the component.
   */
  render() {
    const {
      id,
      value,
      onChange,
      onBlur,
      onClick,
      icon,
      iconAction,
      minLength,
      maxLength,
      placeholder,
    } = this.props;

    return (
      <FormFieldWrapper {...this.props} className="text">
        <FocusPointWidget id={id} onChange={onChange}/>
        <Input
          id={`field-${id}`}
          name={id}
          value={value || ''}
          disabled={this.props.isDisabled}
          icon={icon || null}
          placeholder={placeholder}
          onChange={({ target }) =>
            onChange(id, target.value === '' ? undefined : target.value)
          }
          ref={(node) => {
            this.node = node;
          }}
          onBlur={({ target }) =>
            onBlur(id, target.value === '' ? undefined : target.value)
          }
          onClick={() => onClick()}
          minLength={minLength || null}
          maxLength={maxLength || null}
        />
        {icon && iconAction && (
          <button className={`field-${id}-action-button`} onClick={iconAction}>
            <Icon name={icon} size="18px" />
          </button>
        )}
      </FormFieldWrapper>
    );
  }
}

export default injectIntl(TextWidget);
