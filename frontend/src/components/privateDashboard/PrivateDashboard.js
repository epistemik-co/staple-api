import React, { Component } from 'react';
import { Provider } from "react-redux";
import { Playground, store } from "graphql-playground-react";
import './PrivateDashboard.scss';
import schemaString from '../../schema/objects'
import SplitPane from 'react-split-pane'
import axios from 'axios';
import uuidv1 from 'uuid'


class PrivateDashboard extends Component {

  state = {
    id: "",
    tabs: undefined,
    showObjects: true,
    personal: false,
    ontology: JSON.stringify(require('../../schema/raw-schema'), null, 2).slice(1, -1),
    context: JSON.stringify(require('../../schema/schema-mapping')['@context'], null, 2),
    error: "",
    compiledMessage: "",
    playgroundVersion: 1,
    source: /*"playground.staple-api.org"*/ "localhost"
  }

  componentDidMount = () => {
    this.setPlaygroundHeight(null);
    window.addEventListener("resize", this.setPlaygroundHeight);

    this.getId();
    this.correctHeight();
  }

  correctHeight = () => {
    var x = document.getElementsByClassName("JVBvg");
    x[0].style.maxHeight = 90 + "px";
    x[0].style.minHeight = 53 + "px";
    x[0].firstChild.style.marginTop = 10 + "px";
  }

  escapeRegExp(str) {
    return str.replace(/([.*+?^=!:${}()|\]\\])/g, "\\$1");
  }

  replaceAll(str, find, replace) {
    return str.replace(new RegExp(this.escapeRegExp(find), 'g'), replace);
  }

  getId = async () => {
    let res = await axios.get("http://"+this.state.source+":4000/api/dynamic");
    if (res.status === 200) {
      this.setState({
        id: res.data
      })
    }
  }

  getIdPersonal = async () => {

    this.setState({ customEndPoint: true })

    let data = this.replaceAll(this.replaceAll(this.state.ontology, '\\n', String.fromCharCode(13, 10)), '\\"', '"')

    if (data[0] === '"') {
      data = data.substr(1);
    }
    if (data[data.length - 1] === '"') {
      data = data.substring(0, data.length - 1);
    }


    try {
      let res = await axios.post("http://"+this.state.source+":4000/api/customInit", { "value": data });
      if (res.status === 200) {
        console.log(res.data)

        this.setState({

          id: res.data.id,
          context: JSON.stringify(res.data.context['@context'], null, 2),
          error: "",
          compiledMessage: "Compiled successfully!",
          playgroundVersion: uuidv1()
        })
      }
    } catch (error) {

      if (error.response.data === undefined) {
        error.response.data = "Error";
      }

      this.setState({
        id: "",
        context: "",
        error: error.response.data,
        compiledMessage: ""
      })
    }


    this.setPlaygroundHeight(null);
  }
  setPlaygroundHeight = (e) => {
    let playground = document.getElementsByClassName("playground");
    let topGrid = document.getElementsByClassName("box-grid");
    var space = window.innerHeight - (topGrid[0].offsetHeight) - 30;
    playground[0].style.height = space + "px";
  }

  handleChangeTextArea = (event) => {
    this.setState({ ontology: event.target.value });
  }

  render() {
    return (
      <SplitPane split="horizontal" minSize={40} defaultSize={300} onChange={this.setPlaygroundHeight} id="spliter">


        <div className={
          this.state.showObjects && !this.state.customEndPoint ? "box-grid box-grid3" :
            this.state.showObjects ?
              "box-grid box-grid2" :
              "box-grid box-grid1"
        }>
          <div className="box-left">
            <div className="fixed-top-bar">
              <h3>Ontology (in Turtle syntax)</h3>
              <button className="rdf-compile button play" onClick={this.getIdPersonal}></button>
              <p className="compiled-successfully">{this.state.compiledMessage}</p>
              <p className="error-message">{this.state.error}</p>
            </div>
            <textarea spellCheck="false" className="rdf-textarea" onChange={this.handleChangeTextArea} placeholder="CODE HERE"
              value={
                this.replaceAll(this.replaceAll(this.state.ontology, '\\n', String.fromCharCode(13, 10)), '\\"', '"')
              }
            >

            </textarea>
          </div>


          {this.state.showObjects ?
            <div className="box-right">
              <h3>Json-LD context</h3>
              <div className="context-box">
                <code>
                  <div>
                    <pre>
                      {this.state.context}
                    </pre>
                  </div>
                </code>
              </div>
            </div>
            :
            <React.Fragment></React.Fragment>
          }

          {
            this.state.showObjects && !this.state.customEndPoint ?
              <div className="box-middle">
                <h3>Preloaded data</h3>
                <div className="context-box">
                  <code>
                    <div><pre>{JSON.stringify(schemaString, null, 2)}</pre></div>
                  </code>
                </div>
              </div> :
              <React.Fragment></React.Fragment>
          }

          {
            this.state.showObjects ?
              <button className="button-close" onClick={x => this.setState({ showObjects: false })}>Hide</button> : 
              <button className="button-close" onClick={x => this.setState({ showObjects: true })}>Show</button>
          }

        </div>

        <div className="box-grid">
          <div className="bottom-box" key={this.state.playgroundVersion} >
            <Provider store={store}>
              <Playground endpoint={"http://"+this.state.source+":4000/graphql/" + this.state.id} className="playground" id="playground" />
            </Provider>
          </div>
          <div className="doc-link">
            <p>
              Full documentation available at: <a href="http://staple-api.org">http://staple-api.org</a>
            </p>
          </div>
        </div>


      </SplitPane >


    )
  }
}


export default PrivateDashboard;

