import React from 'react'
import { useDispatch } from 'react-redux';
import { bindActionCreators } from 'redux';
import { chatActions } from '../state';
import '../styles/chatindex.css'

const ChatIndex = ({docRef, userName, userEmail, photoURL}) => {

    const dispatch = useDispatch();
    const { getChatUid } = bindActionCreators(chatActions, dispatch);

    return (
        <div onClick={() => {
            console.log(docRef.data());
            getChatUid(docRef.id);
        }} className='chatIndex-container'>
            <div>
                <img className='sidebar-image-perfil' src={photoURL} alt="Perfil" />
            </div>
            <div>
                <h3>{userName}</h3>
                <h5>{userEmail}</h5>
            </div>
        </div>
    )
}

export default ChatIndex