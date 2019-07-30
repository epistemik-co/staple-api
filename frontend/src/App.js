import React from 'react';
import { Provider } from "react-redux";
import { Playground, store } from "graphql-playground-react";
import './App.scss';
import schemaString from './schema/schema'

function App() {
  return (
    <div className="App">
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
          {schemaString}
          </code>
        </p>
      </div>
      <div className="box-right">
        <h3>Context</h3>
        <p>
          <code>
          {JSON.stringify( require('./schema/schema-mapping'), null, 2)}
          </code>
        </p>
      </div>
      <div className="bottom-box"> 
        <Provider store={store}>
          <Playground endpoint="http://localhost:4000/graphql" className="playground" />
        </Provider>
      </div>
    </div>
  );
}

export default App;

