const initialState = {
  userCredentials: null
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case 'LOGIN_USER':
      return { userCredentials: action.payload };
    case 'LOGOUT_USER':
      return { userCredentials: null };
    case 'GOOGLE_LOGIN_USER':
      return { userCredentials: action.payload }; 
    default:
      return state;
  }
};

export default reducer;
