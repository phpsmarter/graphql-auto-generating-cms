import React, { PropTypes, Component } from 'react';
import {
  Segment,
  Grid,
  Form,
  Button,
  Divider,
  Icon,
  Popup,
  Dropdown,
  Modal,
} from 'semantic-ui-react';

const propTypes = {
  schema: PropTypes.object,
  query: PropTypes.func,
  data: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.boolean,
  ]),
  fields: PropTypes.array,
  update: PropTypes.func,
  collectFieldsData: PropTypes.func,
  getRequestString: PropTypes.func,
  remove: PropTypes.func,
  currentItemId: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.boolean,
  ]),
  uploadImage: PropTypes.func,
  addNewItem: PropTypes.func,
};
const defaultProps = {
  schema: {},
  query() {},
  data: {},
  fields: [],
  update() {},
  collectFieldsData() {},
  getRequestString() {},
  remove() {},
  currentItemId: '',
  uploadImage() {},
  addNewItem() {},
};

class View extends Component {
  constructor(...args) {
    super(...args);
    this.getOptionsForModal = this.getOptionsForModal.bind(this);
    this.addSelectOption = this.addSelectOption.bind(this);
    this.generateModal = this.generateModal.bind(this);
    this.getSelectData = this.getSelectData.bind(this);
    this.generateFields = this.generateFields.bind(this);
    this.checkIfDisabled = this.checkIfDisabled.bind(this);
    this.getPopupImgPath = this.getPopupImgPath.bind(this);
    this.initStatesForSelector = this.initStatesForSelector.bind(this);
    this.state = {
      schema: this.props.schema,
      fields: this.props.fields,
      data: this.props.data,
      currentItemId: this.props.currentItemId,
      popupImgLink: false,
    };
    this.initStatesForSelector(this.props.fields);
  }
  componentWillMount() {
    const { fields, data } = this.state;
    this.getSelectData(fields, data);
  }
  componentWillReceiveProps() {
    this.setState({
      data: this.props.data,
      currentItemId: this.props.currentItemId,
    });
  }
  getDateValue(arg) {
    const date = new Date(arg);
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().length === 2 ? date.getMonth() + 1 : `0${date.getMonth() + 1}`;
    const d = date.getDate().toString().length === 2 ? date.getDate() : `0${date.getDate()}`;
    return `${y}-${m}-${d}`;
  }
  getSelectData(fields, data) {
    fields.forEach((field) => {
      const propName = Object.keys(field)[0];
      if (field[propName].inputControl === 'selection') {
        const options = [];
        const defaultOptions = [];
        const dataForOptions = [];
        const label = field[propName].list.label ?
          field[propName].list.label : Object.keys(field[propName].nestedFields[1])[0];
        const hasOwnAPI = Object.keys(field[propName].list.resolvers.find.args).length !== 0 &&
          Object.keys(field[propName].list.resolvers.create.args).length !== 0;
        if (!hasOwnAPI && data) {
          data[propName].forEach((obj, idx) => {
            defaultOptions.push(idx);
            dataForOptions.push(obj);
            options.push({ text: obj[label], value: idx });
          });
        } else if (hasOwnAPI) {
          const resolver = field[propName].list.resolvers.find.resolver;
          const request = this.props.getRequestString(field[propName].nestedFields);
          this.props.query('query', request, resolver)
            .then((res) => {
              res.data[field[propName].list.resolvers.find.resolver].forEach((obj, idx) => {
                dataForOptions.push(obj);
                options.push({ text: obj[label], value: idx });
                const statement = data[propName].find((item) => {
                  let response;
                  if (item.id) {
                    response = item.id === obj.id;
                  } else if (item._id) {
                    response = item._id === obj._id;
                  }
                  return response;
                });
                if (data && statement) defaultOptions.push(idx);
              });
            })
            .catch((err) => {
              throw new Error(`${propName}, getSelectData, error: ${err}`);
            });
        }
        this.setState({
          [`${propName}DefaultValue`]: defaultOptions,
          [`${propName}Data`]: dataForOptions,
          [propName]: options,
        }, () => {
          setTimeout(() => this.refs[propName].forceUpdate(), 1);
        });
      }
    });
  }
  getOptionsForModal(e, fields) {
    e.preventDefault();
    this.getSelectData(fields);
  }
  getPopupImgPath(propName) {
    if (propName) {
      const p = document.getElementById(`${propName}-p`);
      const uploadPath = this.props.schema.uploadPath ?
        this.fixPath(this.props.schema.uploadPath) : this.props.schema.typeName;
      this.setState({ popupImgLink: `${uploadPath}/${p.innerText}` });
    }
  }
  fixPath(string) {
    let response = '';
    if (string.slice(0, 1) === '/' || string.slice(0, 1) === '.') {
      response = string;
    } else {
      response = `/${string}`;
    }
    if (response.slice(-1) === '/') {
      response = response.slice(0, -1);
    }
    return response;
  }
  isDate(val) {
    const d = new Date(val);
    return !isNaN(d.valueOf()) &&
      typeof (val) !== 'boolean' &&
      typeof (val) !== 'number' &&
      typeof (+val) !== 'number';
  }
  addSelectOption(e, { label, fields }) {
    const propName = e.currentTarget.name;
    const data = this.props.collectFieldsData(fields, false, false, propName);
    const newState = this.state[propName];
    const newData = this.state[`${propName}Data`] ? this.state[`${propName}Data`] : [];
    newState.push({
      text: label ? data[label] : data[Object.keys(data)[1]],
      value: +newState.length,
    });
    newData.push(data);
    this.setState({
      [propName]: newState,
      [`${propName}Data`]: newData,
    }, () => {
      document.querySelector('.modals').click();
    });
  }
  checkIfDisabled(field, propName) {
    const method = this.state.data ?
      this.state.schema.resolvers.update.args : this.state.schema.resolvers.create.args;
    return method[propName] ? field[propName].disabled : true;
  }
  checkOnEnterIfTextarea(e) {
    if (e.target.nodeName === 'INPUT' && e.target.value.length > 100) {
      const textarea = document.createElement('textarea');
      textarea.id = e.target.id;
      textarea.placeholder = e.target.placeholder;
      textarea.innerText = e.target.value;
      e.target.parentNode.insertBefore(textarea, e.target);
      e.target.parentNode.removeChild(e.target);
      document.getElementById(textarea.id).focus();
    }
  }
  initStatesForSelector(fields) {
    fields.forEach((field) => {
      if (field[Object.keys(field)[0]].inputControl === 'selection') {
        this.state[Object.keys(field)[0]] = [];
      }
    });
  }
  generateModal(fields, propName) {
    const to = (fields[propName].nestedFields.length / 2).toFixed(0);
    const from = fields[propName].nestedFields.length - to;
    return (
      <Modal
        id={`${propName}Modal`}
        trigger={
          <Button
            icon
            className="selector-add"
            onClick={e => this.getOptionsForModal(e, fields[propName].nestedFields)}
          >
            <Icon name="plus" />
          </Button>
        }
        className="graphql-cms_modal graphql-cms"
      >
        <Modal.Header>
          Add new select option for "{propName}"
          <div className="btn-row">
            <Button
              type="submit" color="black"
              name={propName}
              onClick={e => this.addSelectOption(e, {
                fields: fields[propName].nestedFields,
                label: fields[propName].list.label,
              })}
            >
              add
            </Button>
          </div>
        </Modal.Header>
        <Modal.Content>
          <Grid as={Form}>
            <Grid.Column computer={8} mobile={16}>
              {fields[propName].nestedFields.slice(0, to).map((field, idx) =>
                this.generateFields(field, idx, false, false, `${propName}/`),
              )}
            </Grid.Column>
            <Grid.Column computer={8} mobile={16}>
              {fields[propName].nestedFields.slice(-from).map((field, idx) =>
                this.generateFields(field, idx, false, false, `${propName}/`),
              )}
            </Grid.Column>
          </Grid>
        </Modal.Content>
      </Modal>
    );
  }
  generateFields(obj, idx, data, dis, prefix) {
    const pr = prefix ? prefix : '';
    const fields = { ...obj };
    const propName = Object.keys(fields)[0];
    const { popupImgLink } = this.state;
    let value = '';
    let checked = '';
    let dateInput = false;
    let disabled = typeof (dis) === 'boolean' ? dis : this.checkIfDisabled(fields, propName);
    let control = fields[propName].inputControl;
    let DOM;
    if (
      fields[propName].nestedFields &&
      fields[propName].nestedFields[0] &&
      fields[propName].inputControl !== 'selection'
    ) {
      disabled = fields[propName].disabled;
      const newData = data ? data[propName] : false;
      return (
        <div className="nestedFields" key={idx}>
          <Divider horizontal>{propName} <Icon name="level down" /></Divider>
          {fields[propName].nestedFields.map((field, index) =>
            this.generateFields(field, index + 300, newData, disabled, `${propName}/`),
          )}
          <Divider horizontal>{propName} <Icon name="level up" /></Divider>
        </div>
      );
    }
    if (
      data && (data[propName] ||
      typeof (data[propName]) === 'boolean') &&
      fields[propName].inputType !== 'file'
    ) {
      value = data[propName];
      if (value.length > 100) {
        control = 'textarea';
      }
    } else {
      value = '';
    }
    if (data && fields[propName].inputType === 'checkbox') {
      checked = !data ? false : data[propName];
    } else {
      checked = false;
    }
    if (
      this.isDate(value) ||
      propName === 'createdAt' ||
      propName === 'updatedAt' ||
      propName === 'deletedAt' ||
      fields[propName].inputType === 'date'
    ) {
      dateInput = 'date';
      value = !data ? '' : this.getDateValue(value);
    }
    const type = dateInput || fields[propName].inputType;
    if (data || (propName !== 'id' && propName !== '_id' && propName !== 'offset' && propName !== 'limit')) {
      if (type === 'file') {
        DOM = (
          <div className="file-form" key={idx}>
            <Button
              as="label"
              content={fields[propName].label}
              className="file-form-btn"
              icon="upload"
              disabled={disabled}
              labelPosition="right"
              htmlFor={`${pr}${propName}-input`}
            />
            <Popup
              onMount={() => this.getPopupImgPath(propName)}
              onClose={() => this.getPopupImgPath(false)}
              name={propName}
              trigger={
                <p className="file-name" id={`${pr}${propName}-p`}>
                  {data[propName]}
                </p>
              }
            >
              <img id={`${pr}${propName}-img`} src={popupImgLink} alt={propName} />
            </Popup>
            <input
              disabled={disabled}
              onChange={this.props.uploadImage}
              id={`${pr}${propName}-input`}
              type="file"
            />
          </div>
        );
      } else if (fields[propName].inputControl === 'selection') {
        const options = this.state[propName];
        const defaultOptions = data ? this.state[`${propName}DefaultValue`] : [];
        const hasOwnAPI = Object.keys(fields[propName].list.resolvers.find.args).length !== 0 &&
          Object.keys(fields[propName].list.resolvers.create.args).length !== 0;

        DOM = (
          <div className="file-form" key={idx}>
            <label>{fields[propName].label}</label>
            {!hasOwnAPI ? this.generateModal(fields, propName) : null}
            {options ?
              <Dropdown
                ref={propName}
                placeholder={fields[propName].label}
                id={`${pr}${propName}`}
                fluid
                multiple
                selection
                search
                defaultValue={defaultOptions}
                options={options}
              /> : null}
          </div>
        );
      } else {
        DOM = (
          <Form.Field
            key={idx}
            label={fields[propName].label}
            control={control}
            type={type}
            id={`${pr}${propName}`}
            defaultValue={value}
            defaultChecked={checked}
            onInput={this.checkOnEnterIfTextarea}
            disabled={disabled}
            placeholder={propName}
          />
        );
      }
    }
    return DOM;
  }
  render() {
    const { Column } = Grid;
    const { fields, schema, currentItemId, data } = this.state;
    const { update, remove, addNewItem } = this.props;
    const { generateFields } = this;
    const to = (fields.length / 2).toFixed(0);
    const from = fields.length - to;
    return (
      <Segment color="black" className="View">
        <div className="btn-row">
          {currentItemId ?
            <Button
              type="submit" color="black"
              onClick={addNewItem}
              disabled={!schema.resolvers.create}
            >
              add new
            </Button> : null}
          <Button
            type="submit" color="black"
            onClick={!schema.resolvers.update ? null : update}
            disabled={!schema.resolvers.update}
          >
            save
          </Button>
          <Button
            type="submit" color="black"
            id={currentItemId}
            onClick={!schema.resolvers.remove ? null : remove}
            disabled={!schema.resolvers.remove}
          >
            remove
          </Button>
        </div>
        <Grid as={Form}>
          <Column computer={8} mobile={16}>
            {fields.slice(0, to).map((field, idx) =>
              generateFields(field, idx, data),
            )}
          </Column>
          <Column computer={8} mobile={16}>
            {fields.slice(-from).map((field, idx) =>
              generateFields(field, idx, data),
            )}
          </Column>
        </Grid>
      </Segment>
    );
  }
}

View.propTypes = propTypes;
View.defaultProps = defaultProps;

export default View;