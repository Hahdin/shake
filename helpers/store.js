import { createStore, applyMiddleware, compose } from 'redux';
import thunkMiddleware from 'redux-thunk';
import { createLogger } from 'redux-logger';
import rootReducer from '../reducers';
const loggerMiddleware = createLogger();
let composeEnhancers = compose
const middleware = [thunkMiddleware, loggerMiddleware]
const enhancers = []
// This allows us to use the redux dev tools		
if (typeof window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ === 'function') {
  composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
}
export const store = createStore(
    rootReducer,
    composeEnhancers(
      applyMiddleware(...middleware),
      ...enhancers
    )
);