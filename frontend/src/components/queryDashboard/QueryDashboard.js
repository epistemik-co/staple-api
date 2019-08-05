import React, { Component } from 'react';
import { Provider } from "react-redux";
import { Playground, store } from "graphql-playground-react";
import './QueryDashboard.scss';
import schemaString from '../../schema/schema'
import schemattl from '../../schema/schemattl'
import SplitPane from 'react-split-pane'


class QueryDashboard extends Component {

  componentDidMount = () => {
    this.setPlaygroundHeight(null);
    window.addEventListener("resize", this.setPlaygroundHeight);
  }

  setPlaygroundHeight = (e) => {
    let playground = document.getElementsByClassName("playground");
    let topGrid = document.getElementsByClassName("box-grid");
    var space = window.innerHeight - (topGrid[0].offsetHeight)
    playground[0].style.height = space + "px";

    let schemaContext = document.getElementsByClassName("schema-context-text");
    schemaContext[0].style.overflow = "scroll";


  }

  render() {
    return (
      <SplitPane split="hotizontal" minSize={40} defaultSize={300} onChange={this.setPlaygroundHeight} id="spliter">

        <div className="box-grid">
          <div className="box-left-middle">
            <h3 className="box-left-query">RDF</h3>
            <div>
              <code >
                {schemattl.split('\n').map((item, i) => {
                  return <p key={i}>{item}</p>;
                })}
              </code>
            </div>
          </div>

          <div className="box-right">
            <h3>Context</h3>
            <p className="schema-context-text">
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

