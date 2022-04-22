import { addDoc, collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import React, { useEffect, useState } from 'react'
import { MdSend } from 'react-icons/md';
import { useSelector } from 'react-redux';
import ScrollToBottom from 'react-scroll-to-bottom';
import '../styles/chatbox.css'

const Chatbox = () => {
    const [value, setValue] = useState("");
    const [listMessage, setlistMessage] = useState([]);
    const [sender, setSender] = useState();
    const userCredential = useSelector((state) => state.auth.userCredentials);
    const docRef = useSelector((state) => state?.chat.chatCredentials);

    useEffect(() => {
        console.log("entro al useEffect");
        console.log(docRef);
        if(docRef){
            setSender(docRef.chat.data());
            const q = query(collection(docRef?.chatDocRef, "message"), orderBy('date'));
            
            console.log(q.size);
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const listTemp = [];
                snapshot.docs.forEach((doc) => {
                    console.log(doc.data());
                    listTemp.push(doc.data());
                });
                setlistMessage(listTemp);
            });
            return unsubscribe;
        }
    }, [docRef, userCredential?.uid]);

    const onSend = async (e) => {
        e.preventDefault();
        if(value){       
            const colRef = collection(docRef.chatDocRef, "message")
            await addDoc(colRef, {
                message: value,
                uid: userCredential.uid,
                date: new Date().toISOString(),
            });
        } 
        setValue("");
    }

    return (
        <div className='Chatbox'>
            <div className='chatbox-info-container'>
                {console.log(sender?.user1.uid)}
                {console.log(userCredential?.uid)}
                {(sender?.user1.uid === userCredential?.uid) ? (
                <>
                    <div>
                        <img className='sidebar-image-perfil' src={sender?.user2.photoURL} alt="Perfil" />
                    </div>
                    <div>
                        <h3>{sender?.user2.name}</h3>
                    </div>
                </>
                ):(
                <>
                    <div>
                        <img className='sidebar-image-perfil' src={sender?.user1.photoURL} alt="Perfil" />
                    </div>
                    <div>
                        <h3>{sender?.user1.name}</h3>
                    </div>
                </>
                )}
            </div>
            <div className='chatbox-container'>
                <ScrollToBottom className='chatbox-scroll-container'>
                    {listMessage.map((message, index) => {
                        if(message.uid === userCredential.uid){
                            return(
                                <div key={index} className='chatbox-message-user'>
                                    <span className='chatbox-message'>{message.message}</span>
                                </div>
                                )
                        }else{
                            return(
                                <div key={index} className='chatbox-incoming-message-user'>
                                    <span className='chatbox-message-incoming'>{message.message}</span>
                                </div>
                                )
                        }
                    })}
                </ScrollToBottom>
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