import React, { Component } from "react";
import { connect } from "react-redux";
import PlacesAutocomplete, {
  geocodeByAddress,
  getLatLng
} from "react-places-autocomplete";
import { Link } from "react-router-dom";

import AnnotatedSection from "../components/AnnotatedSection";
import FontAwesomeIcon from "@fortawesome/react-fontawesome";
import faArrowAltCircleUp from "@fortawesome/fontawesome-free-solid/faArrowAltCircleUp";

import { Button, FormGroup, Input, Label } from "reactstrap";

/*
  Transport component
  @description Page component used to update a product's information.
*/
class Transport extends Component {
  constructor(props) {
    super(props);

    this.state = {
      latitude: "",
      longitude: "",
      address: "",
      updateButtonDisabled: false,
      customDataInputs: {}
    };
    this.onChange = address => this.setState({ address });
  }

  componentDidMount() {
    // shorthand to get the route parameters
    this.params = this.props.match.params;

    // fetch the product's custom data fields then add them to the state
    this.props.passageInstance
      .getProductCustomDataById(
        String(this.params.productId).valueOf(),
        this.params.versionId
          ? String(this.params.versionId).valueOf()
          : "latest"
      )
      .then(result => {
        let customData = JSON.parse(result);
        customData["Transport Type"] = "";
        Object.keys(customData).map(dataKey => {
          const inputKey = this.appendInput();
          this.setState({
            customDataInputs: {
              ...this.state.customDataInputs,
              [inputKey]: {
                key: dataKey,
                value: dataKey !== "Phase" ? customData[dataKey] : "Transport"
              }
            }
          });
          return false;
        });
      })
      .catch(error => {
        // if something goes wrong when fetching the product, we just redirect
        // to the home page to prevent displaying false/wrong information
        return this.props.history.push("/");
      });
  }

  // method that adds a new custom data input to the state, which is then
  // reflected on the page by the render() function
  appendInput() {
    var newInputKey = `input-${
      Object.keys(this.state.customDataInputs).length
    }`; // this might not be a good idea (e.g. when removing then adding more inputs)
    this.setState({
      customDataInputs: {
        ...this.state.customDataInputs,
        [newInputKey]: { key: "", value: "" }
      }
    });
    return newInputKey;
  }

  // method that gets the (lat, lng) pair of the selected location
  // in the location autocompletion search bar
  handleSelect = address => {
    this.setState({ address, updateButtonDisabled: true });

    geocodeByAddress(this.state.address)
      .then(results => getLatLng(results[0]))
      .then(latLng => {
        this.setState({
          latitude: latLng.lat,
          longitude: latLng.lng,
          updateButtonDisabled: false
        });
      })
      .catch(error => console.error("Error", error));
  };

  // method that sends the updated data to the smart contract "updateProduct" method
  handleUpdateProduct = () => {
    // generate a 'clean' representation of the custom data
    var customDataObject = {};
    Object.keys(this.state.customDataInputs).map(inputKey => {
      const input = this.state.customDataInputs[inputKey];
      if (input.key.trim() !== "" && input.value.trim() !== "") {
        customDataObject[input.key] = input.value;
      }
      return false;
    });

    // actually call the smart contract method
    this.props.passageInstance
      .updateProduct(
        String(this.params.productId).valueOf(),
        this.state.latitude.toString(),
        this.state.longitude.toString(),
        JSON.stringify(customDataObject),
        {
          from: this.props.web3Accounts[0],
          gas: 1000000
        }
      )
      .then(result => {
        // redirect to the product page upon success
        this.props.history.push("/products/" + this.params.productId);
      });
  };

  render() {
    const inputProps = {
      value: this.state.address,
      onChange: this.onChange,
      placeholder: "Location"
    };

    return (
      <div>
        <AnnotatedSection
          annotationContent={
            <div>
              <FontAwesomeIcon
                fixedWidth
                style={{ paddingTop: "3px", marginRight: "6px" }}
                icon={faArrowAltCircleUp}
              />
              Transportation information
            </div>
          }
          panelContent={
            <div>
              <FormGroup>
                <Label>Location</Label>
                <PlacesAutocomplete
                  inputProps={inputProps}
                  onSelect={this.handleSelect}
                  classNames={{ input: "form-control" }}
                />
              </FormGroup>
              <FormGroup>
                {// for every custom data field specified in the component state,
                // render an input with the appropriate key/value pair
                Object.keys(this.state.customDataInputs)
                  .filter(inputKey => {
                    return ["Owner", "Phase", "Transport Type"].includes(
                      this.state.customDataInputs[inputKey].key
                    );
                  })
                  .map(inputKey => (
                    <FormGroup style={{ display: "flex" }} key={inputKey}>
                      <Input
                        value={this.state.customDataInputs[inputKey].key}
                        placeholder="Property (eg. color)"
                        style={{ flex: 1, marginRight: "15px" }}
                      />
                      {this.state.customDataInputs[inputKey].key !==
                      "Transport Type" ? (
                        <Input
                          value={this.state.customDataInputs[inputKey].value}
                          placeholder="Value (eg. red)"
                          disabled={
                            this.state.customDataInputs[inputKey].key ===
                            "Phase"
                          }
                          style={{ flex: 1 }}
                          onChange={e => {
                            this.setState({
                              customDataInputs: {
                                ...this.state.customDataInputs,
                                [inputKey]: {
                                  ...this.state.customDataInputs[inputKey],
                                  value: e.target.value
                                }
                              }
                            });
                          }}
                        />
                      ) : (
                        <Input
                          defaultValue={
                            this.state.customDataInputs[inputKey].value
                          }
                          type={"select"}
                          style={{ flex: 1 }}
                          onChange={e => {
                            this.setState({
                              customDataInputs: {
                                ...this.state.customDataInputs,
                                [inputKey]: {
                                  ...this.state.customDataInputs[inputKey],
                                  value: e.target.value
                                }
                              }
                            });
                          }}
                        >
                          {this.state.customDataInputs[inputKey].key ===
                          "Transport Type" ? (
                            <option disabled value="">
                              (select)
                            </option>
                          ) : (
                            ""
                          )}
                          {this.state.customDataInputs[inputKey].key ===
                          "Transport Type" ? (
                            <option value="Road">Road</option>
                          ) : (
                            ""
                          )}
                          {this.state.customDataInputs[inputKey].key ===
                            "Transport Type" && (
                            <option value="Rail">Rail</option>
                          )}
                          {this.state.customDataInputs[inputKey].key ===
                            "Transport Type" && (
                            <option value="Ship">Ship</option>
                          )}
                          {this.state.customDataInputs[inputKey].key ===
                            "Transport Type" && (
                            <option value="Plane">Plane</option>
                          )}
                          {this.state.customDataInputs[inputKey].key ===
                            "Transport Type" && (
                            <option value="Other">Other</option>
                          )}
                        </Input>
                      )}
                    </FormGroup>
                  ))}
                <Link to="#" onClick={() => this.appendInput()}>
                  Add additional information
                </Link>
              </FormGroup>
              <Button
                disabled={this.state.updateButtonDisabled}
                color="primary"
                onClick={this.handleUpdateProduct}
              >
                Save changes
              </Button>
            </div>
          }
        />
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    passageInstance: state.reducer.passageInstance,
    web3Accounts: state.reducer.web3Accounts
  };
}

export default connect(mapStateToProps)(Transport);
