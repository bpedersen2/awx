import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import { Trans } from '@lingui/macro';
import {
  PageSection,
  PageSectionVariants,
  Title,
  Form,
  FormGroup,
  TextInput,
  ActionGroup,
  Toolbar,
  ToolbarGroup,
  Button,
  Gallery,
  Card,
  CardBody,
} from '@patternfly/react-core';

import { ConfigContext } from '../../../context';
import Lookup from '../../../components/Lookup';
import AnsibleSelect from '../../../components/AnsibleSelect'
const { light } = PageSectionVariants;
class OrganizationAdd extends React.Component {
  constructor(props) {
    super(props);

    this.handleChange = this.handleChange.bind(this);
    this.onSelectChange = this.onSelectChange.bind(this);
    this.onLookupChange = this.onLookupChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.onSuccess = this.onSuccess.bind(this);
    this.onCancel = this.onCancel.bind(this);
    this.format = this.format.bind(this);
  }

  state = {
    name: '',
    description: '',
    results: [],
    instance_groups: [],
    custom_virtualenv: '',
    error: '',
  };

  onSelectChange(value, _) {
    this.setState({ custom_virtualenv: value });
  };

  onLookupChange(id, _) {
    let selected = { ...this.state.results }
    const index = id - 1;
    selected[index].isChecked = !selected[index].isChecked;
    this.setState({ selected })
  }

  resetForm() {
    this.setState({
      name: '',
      description: '',
    });
    let reset = [];
    this.state.results.map((result) => {
      reset.push({ id: result.id, name: result.name, isChecked: false });
    })
    this.setState({ results: reset });
  }

  handleChange(_, evt) {
    this.setState({ [evt.target.name]: evt.target.value });
  }

  async onSubmit() {
    const { api } = this.props;
    const data = Object.assign({}, { ...this.state });
    try {
      const { data: response } = await api.createOrganization(data);
      const url = response.related.instance_groups;
      const selected = this.state.results.filter(group => group.isChecked);
      try {
        await api.createInstanceGroups(url, selected);
        this.resetForm();
      } catch (err) {
        this.setState({ createInstanceGroupsError: err })
      } finally {
        this.onSuccess(response.id);
      }
    }
    catch (err) {
      this.setState({ onSubmitError: err })
    }
  }

  onCancel() {
    this.props.history.push('/organizations');
  }

  onSuccess(id) {
    this.props.history.push(`/organizations/${id}`);
  }

  format(data) {
    let results = [];
    data.results.map((result) => {
      results.push({ id: result.id, name: result.name, isChecked: false });
    });
    return results;
  };

  async componentDidMount() {
    const { api } = this.props;
    try {
      const { data } = await api.getInstanceGroups();
      this.format(data);
      this.setState({ results });
    } catch (error) {
      this.setState({ getInstanceGroupsError: error })
    }
  }

  render() {
    const { name, results } = this.state;
    const enabled = name.length > 0; // TODO: add better form validation

    return (
      <Fragment>
        <PageSection variant={light} className="pf-m-condensed">
          <Title size="2xl">
            <Trans>Organization Add</Trans>
          </Title>
        </PageSection>
        <PageSection>
          <Card>
            <CardBody>
              <Form autoComplete="off">
                <Gallery gutter="md">
                  <FormGroup
                    label="Name"
                    isRequired
                    fieldId="add-org-form-name"
                  >
                    <TextInput
                      isRequired
                      type="text"
                      id="add-org-form-name"
                      name="name"
                      value={this.state.name}
                      onChange={this.handleChange}
                    />
                  </FormGroup>
                  <FormGroup label="Description" fieldId="add-org-form-description">
                    <TextInput
                      id="add-org-form-description"
                      name="description"
                      value={this.state.description}
                      onChange={this.handleChange}
                    />
                  </FormGroup>
                  <FormGroup label="Instance Groups" fieldId="simple-form-instance-groups">
                    <Lookup
                      lookup_header="Instance Groups"
                      lookupChange={this.onLookupChange}
                      data={results}
                    />
                  </FormGroup>
                  <ConfigContext.Consumer>
                    {({ custom_virtualenvs }) =>
                      <AnsibleSelect
                        labelName="Ansible Environment"
                        selected={this.state.custom_virtualenv}
                        selectChange={this.onSelectChange}
                        data={custom_virtualenvs}
                      />
                    }
                  </ConfigContext.Consumer>
                </Gallery>
                <ActionGroup className="at-align-right">
                  <Toolbar>
                    <ToolbarGroup>
                      <Button className="at-C-SubmitButton" variant="primary" onClick={this.onSubmit} isDisabled={!enabled}>Save</Button>
                    </ToolbarGroup>
                    <ToolbarGroup>
                      <Button className="at-C-CancelButton" variant="secondary" onClick={this.onCancel}>Cancel</Button>
                    </ToolbarGroup>
                  </Toolbar>
                </ActionGroup>
              </Form>
            </CardBody>
          </Card>
        </PageSection>
      </Fragment>
    );
  }
}

OrganizationAdd.contextTypes = {
  custom_virtualenvs: PropTypes.array,
};

export default withRouter(OrganizationAdd);
