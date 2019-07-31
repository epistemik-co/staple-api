import React, { Component } from 'react';
import { Provider } from "react-redux";
import { Playground, store } from "graphql-playground-react";
import './PrivateDashboard.scss';
import schemaString from '../../schema/schema'
import SplitPane from 'react-split-pane'


class PrivateDashboard extends Component {

  componentDidMount = () => {
    this.setPlaygroundHeight(null);
    window.addEventListener("resize", this.setPlaygroundHeight);
  }

  setPlaygroundHeight = (e) => {
    let playground = document.getElementsByClassName("playground");
    let topGrid = document.getElementsByClassName("box-grid");
    var space = window.innerHeight - (topGrid[0].offsetHeight)
    playground[0].style.height = space + "px";
  }

  render() {
    return (
      <SplitPane split="hotizontal" minSize={40} defaultSize={300} onChange={this.setPlaygroundHeight} id="spliter">

        <div className="box-grid">
          <div className="box-left">
            <h3>RDF</h3>
            <textarea className="rdf-textarea" placeholder="CODE HERE"></textarea>
          </div>
          <div className="box-middle">
            <h3>Schema</h3>
            <p>
              <code>
                {schemaString.split('\n').map((item, i) => {
                  return <p key={i}>{item}</p>;
                })}
              </code>
            </p>
          </div>
          <div className="box-right">
            <h3>Context</h3>
            <p>
              <code>
                <div><pre>{JSON.stringify(require('../../schema/schema-mapping'), null, 2)}</pre></div>
              </code>
            </p>
          </div>
        </div>
        <div className="box-grid">
          <div className="bottom-box">
            <Provider store={store}>
              <Playground endpoint="http://localhost:4000/graphql" className="playground" id="playground" />
            </Provider>
          </div>
        </div>
      </SplitPane >


    )
  }
}


export default PrivateDashboard;

