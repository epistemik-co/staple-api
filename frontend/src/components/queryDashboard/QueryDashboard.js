import React, { Component } from 'react';
import { Provider } from "react-redux";
import { Playground, store } from "graphql-playground-react";
import './QueryDashboard.scss';
import schemaString from '../../schema/schema'
import SplitPane from 'react-split-pane'


class QueryDashboard extends Component {

  componentDidMount = () => {
    this.setPlaygroundHeight(null);
    window.addEventListener("resize", this.setPlaygroundHeight);
  }

  setPlaygroundHeight = (e) => {
    let element2 = document.getElementsByClassName("playground");
    let element = document.getElementsByClassName("box-grid");
    var space = window.innerHeight - (element[0].offsetHeight)
    element2[0].style.height = space + "px";
  }

  render() {
    return (
      <SplitPane split="hotizontal" minSize={50} defaultSize={100} onChange={this.setPlaygroundHeight} id="spliter">

        <div className="box-grid">
          <div className="box-left">
            <h3>RDF</h3>
            <p>
              <code>
                CODE
          </code>
            </p>
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


export default QueryDashboard;

