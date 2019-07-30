import React, { Component } from 'react';
import './App.scss';
import QueryDashboard from './components/queryDashboard/QueryDashboard'


class App extends Component {
  state = {
    queryDashboard: undefined,
    privateDashboard: undefined
  }

  render() {
    return (

      <div className="main-container">
        { this.state.queryDashboard === undefined &&  this.state.privateDashboard === undefined ?
        <div className="home-page-container">
          <p>Choose option</p>
          <h2 onClick={e => this.setState({queryDashboard: true})}>Query Dashboard</h2>
          <h2 onClick={e => this.setState({privateDashboard: true})}>Private Dashboard</h2>
        </div> :
         this.state.privateDashboard === undefined ? 

         <QueryDashboard></QueryDashboard>
          : 
          <h3>Not implemented</h3>
        }



      </div>

    );
  }
}

export default App;

