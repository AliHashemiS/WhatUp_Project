import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/firebase";

export const getChatUid = (id) => async (dispatch) => {
    try {
        const chatDocRef = doc(db, 'chats', id);
        const chat = await getDoc(chatDocRef);
        dispatch({ type: 'SAVE_CHAT', payload: {chatDocRef, chat} });
    } catch (error) {
        throw error;
    }
};