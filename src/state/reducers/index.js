import { combineReducers } from 'redux';
import authReducer from './authReducer';
import chatReducer from './chatReducer';

const reducers = combineReducers({
  auth: authReducer,
  chat: chatReducer,
});

export default reducers;