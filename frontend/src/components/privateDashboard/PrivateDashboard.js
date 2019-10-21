import React, { Component } from 'react';
import { Provider } from "react-redux";
import { Playground, store } from "graphql-playground-react";
import './PrivateDashboard.scss';
import schemaString from '../../schema/objects'
import SplitPane from 'react-split-pane'
import axios from 'axios';


class PrivateDashboard extends Component {

  state = {
    id: "",
    tabs: undefined,
    showObjects: true,
    personal: false,
    ontology: JSON.stringify(require('../../schema/raw-schema'), null, 2),
    context: JSON.stringify(require('../../schema/schema-mapping')["@context"], null, 2),
    error: "",
    compiledMessage: ""
  }

  componentDidMount = () => {
    this.setPlaygroundHeight(null);
    window.addEventListener("resize", this.setPlaygroundHeight);

    this.getId();
  }

  escapeRegExp(str) {
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
  }

  replaceAll(str, find, replace) {
    return str.replace(new RegExp(this.escapeRegExp(find), 'g'), replace);
  }

  getId = async () => {
    let res = await axios.get('http://localhost:4000/api/dynamic');
    if (res.status === 200) {
      this.setState({
        id: res.data, tabs: [
          {
            "endpoint": "http://localhost:4000/graphql" + res.data,
            "query": "defaultQuery",
          }
        ]
      })
    }
  }

  getIdPersonal = async () => {
    this.setState({ customEndPoint: true })

    let data = this.replaceAll(this.replaceAll(this.state.ontology, '\\n', String.fromCharCode(13, 10)), '\\"', '"').slice(1, -1)
    try {
      let res = await axios.post('http://localhost:4000/api/customInit', { "value": data });
      if (res.status === 200) {
        this.setState({
          id: res.data.id,
          context: JSON.stringify(res.data.context['@context'], null, 2),
          error: "",
          compiledMessage: "Compiled successfully!"
        })
      }
    } catch (error) {
      this.setState({
        id: "",
        context: "",
        error: error.response.data,
        compiledMessage: ""
      })
    }
  }
  setPlaygroundHeight = (e) => {
    let playground = document.getElementsByClassName("playground");
    let topGrid = document.getElementsByClassName("box-grid");
    var space = window.innerHeight - (topGrid[0].offsetHeight)
    playground[0].style.height = space + "px";
  }

  handleChangeTextArea = (event) => {
    this.setState({ ontology: event.target.value });
  }

  render() {
    return (
      <SplitPane split="hotizontal" minSize={40} defaultSize={300} onChange={this.setPlaygroundHeight} id="spliter">

        <div className={this.state.showObjects && !this.state.customEndPoint ? "box-grid box-grid3" : "box-grid box-grid2"}>
          <div className="box-left">
            <div className="fixed-top-bar">
              <h3>RDF</h3>
              <button className="rdf-compile button play" onClick={this.getIdPersonal}></button>
              <p className="compiled-successfully">{this.state.compiledMessage}</p>
              <p className="error-message">{this.state.error}</p>
            </div>
            <textarea spellcheck="false" className="rdf-textarea" onChange={this.handleChangeTextArea} placeholder="CODE HERE">
              {
                this.replaceAll(this.replaceAll(this.state.ontology, '\\n', String.fromCharCode(13, 10)), '\\"', '"').slice(1, -1)
              }
            </textarea>
          </div>


          <div className="box-right">
            <h3>Context</h3>
            <div class="context-box">
              <code>
                <div>
                  <pre>
                    {this.state.context}
                  </pre>
                </div>
              </code>
            </div>
          </div>

          {this.state.showObjects && !this.state.customEndPoint ?
            <div className="box-middle">
              <h3>Objects</h3>
              <button className="button-close" onClick={x => this.setState({ showObjects: false })}>X</button>
              <div class="context-box">
                <code>
                  <div><pre>{JSON.stringify(schemaString, null, 2)}</pre></div>
                </code>
              </div>
            </div> :
            !this.state.customEndPoint ?
              <button className="button-close" onClick={x => this.setState({ showObjects: true })}>Show example objects</button>
              :
              <React.Fragment></React.Fragment>
          }
        </div>

        <div className="box-grid">
          <div className="bottom-box">
            <Provider store={store}>
              <Playground endpoint={"http://localhost:4000/graphql" + this.state.id} className="playground" id="playground"/>
            </Provider>
          </div>
        </div>
      </SplitPane >


    )
  }
}


export default PrivateDashboard;

