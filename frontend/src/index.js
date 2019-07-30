import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { Playground, store } from "graphql-playground-react";

ReactDOM.render(
  <Provider store={store}>
    <Playground endpoint="http://localhost:4000/graphql" />

  </Provider>,
  document.body
);