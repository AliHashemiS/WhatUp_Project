const initialState = {
    chatCredentials: null
};

const reducer = (state = initialState, action) => {
    switch (action.type) {
        case 'SAVE_CHAT':
            return { chatCredentials: action.payload };
        default:
            return state;
    }
};

export default reducer;
