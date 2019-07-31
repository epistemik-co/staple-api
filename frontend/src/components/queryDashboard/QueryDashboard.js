import React, { Component } from 'react';
import { Provider } from "react-redux";
import { Playground, store } from "graphql-playground-react";
import './QueryDashboard.scss';
import schemaString from '../../schema/schema'
import SplitPane from 'react-split-pane'

class QueryDashboard extends Component {
  render() {
    return (
      <div className="App">
        <div className="box-left">
          <h3>RDF</h3>
          <p>
            <SplitPane split="hotizontal" minSize={50} defaultSize={100}>
              <div>a</div>
              <div>b</div>
            </SplitPane>
            {/* <code>
              CODE
          </code> */}
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
        <div className="bottom-box">
          <Provider store={store}>
            <Playground endpoint="http://localhost:4000/graphql" className="playground" />
          </Provider>
        </div>
      </div>
    )
  }
}


export default QueryDashboard;

