import { addDoc, collection, doc, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react'
import { MdSend } from 'react-icons/md';
import { useSelector } from 'react-redux';
import { db } from '../firebase/firebase';
import '../styles/chatbox.css'

const Chatbox = () => {
    const [value, setValue] = useState("");
    const [listMessage, setlistMessage] = useState([]);
    const userCredential = useSelector((state) => state.auth.userCredentials);

    useEffect(() => {
        console.log("entro al useEffect")
        // if(userCredential){
        //     const q = query(collection(db, "chats"), orderBy('date'), where("uid", "==", userCredential.uid));
        //     const unsubscribe = onSnapshot(q, (snapshot) => {
        //         const listTemp = [];
        //         snapshot.docs.forEach((doc) => {
        //             listTemp.push(doc.data().message);
        //         });
        //         setlistMessage(listTemp);
        //     });
        //     return unsubscribe;
        // }
    }, [userCredential]);

    const onSend = async (e) => {
        e.preventDefault();
        if(value){

            let message = {
                message: value,
                uid: userCredential.uid,
                date: new Date().toISOString(),
            };
            
            await addDoc(collection(db, 'mensajes'), message);

            let chat ={
                x:"x",
                y:"y",
                date: new Date().toISOString(),
                message: "x"
            }
        } 
        setValue("");
    }

    return (
        <div className='Chatbox'>
            <div className='chatbox-container'>
                {listMessage.map((message, index) => {
                    return(
                        <div key={index} className='chatbox-message-user'>
                            <span className='chatbox-message'>{message}</span>
                        </div>
                        )
                })}
                <div className='chatbox-incoming-message-user'>
                    <span className='chatbox-message-incoming'>Mensaje entrante</span>
                </div>
            </div>
            <form onSubmit={onSend} className='chatbox-form-container'>
                <div className='chatbox-form-div-container'>
                    <input value={value} onChange={(e)=>{ 
                        e.preventDefault(); 
                        setValue(e.target.value);
                    }} type='text' className='chatbox-form-input' placeholder='Enviar mensaje'/>
                    
                    <button type='submit' className='chatbox-form-button'><MdSend size={"1.8em"} className='chatbox-send'/></button>
                </div>
            </form>
        </div>
    )
}

export default Chatbox