import React from 'react'
import { Router, Route } from 'react-router-dom';
import { connect } from 'react-redux';
import { history, } from '../helpers';
import { MyNavBar } from '../components/MyNavBar/MyNavBar';
import { MapPage} from '../components/MapPage/'
const App = ({ ...props }) => {
  return (
    <div className="container-fluid">
        <Router history={history}>
          <div>
            <MyNavBar />
            <Route path="/" exact component={MapPage} />
            <Route path="/map" component={MapPage} />
          </div>
        </Router>
     </div>
  );
}
const mapStateToProps = (state) => {
  return {
  };
}
const connectedApp = connect(mapStateToProps)(App);
export { connectedApp as App }; 
