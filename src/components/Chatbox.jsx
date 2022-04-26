import { addDoc, collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import React, { useEffect, useState } from 'react'
import { MdSend } from 'react-icons/md';
import { FiPaperclip } from 'react-icons/fi';
import { RiWechatLine } from "react-icons/ri";
import { useSelector } from 'react-redux';
import ScrollToBottom from 'react-scroll-to-bottom';

import '../styles/chatbox.css'
import Modals from './Modals';
import { storage } from '../firebase/firebase';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';

const Chatbox = () => {
    const [value, setValue] = useState("");
    const [listMessage, setlistMessage] = useState([]);
    const [sender, setSender] = useState();
    const [showModal, setShowModal] = useState(false);
    const [listFiles, setListFiles] = useState([]);
    const [listFilesSendURL, setListFilesSendURL] = useState([]);
    const [uploadValue, setUploadValue] = useState(0);
    const [messageFile, setMessageFile] = useState("");

    const userCredential = useSelector((state) => state.auth.userCredentials);
    const docRef = useSelector((state) => state?.chat.chatCredentials);

    useEffect(() => {
        console.log("entro al useEffect");
        //console.log(docRef.chat.data())
        console.log(listFiles.length);
        if(listFiles.length !== 0){
            let listTemp = [];
            listFiles.forEach((file) => {
                let type = file.type.split("/");
                let storageRef;
                let uploadTask;
                switch (type[0]) {
                    case "image":
                        storageRef = ref(storage, `Image/${file.name}`);
                        break;
                    case "audio":
                        storageRef = ref(storage, `Audio/${file.name}`);
                        break;
                    case "video":
                        storageRef = ref(storage, `Video/${file.name}`);
                        break;
                    default:
                        storageRef = ref(storage, `OtherFile/${file.name}`);
                        break;
                }
                uploadTask = uploadBytesResumable(storageRef, file);
                uploadTask.on('state_changed', (snapshot) => {
                    setUploadValue((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                }, (error) => {
                    setMessageFile(error);
                }, () => {
                    setMessageFile("Archivo Subido!");
                    getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                        listTemp.push({urlFile:downloadURL,typeFile:type[0]});
                        console.log('File available at', downloadURL);
                    });
                });
            });
            setListFilesSendURL(listTemp);
            setListFiles([]);
            setUploadValue(0);
            setMessageFile("");
        }
        
        if(docRef){
            setSender(docRef.chat.data());
            const q = query(collection(docRef?.chatDocRef, "message"), orderBy('date'));
            
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const listTemp = [];
                snapshot.docs.forEach((doc) => {
                    listTemp.push(doc.data());
                });
                setlistMessage(listTemp);
            });
            return unsubscribe;
        }
    }, [docRef, userCredential?.uid, listFiles, listFilesSendURL, uploadValue]);

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

    const onSendFiles = () => {
        if (listFilesSendURL.length !== 0){
            listFilesSendURL.forEach( async (file) => {
                console.log("aaaaa");
                console.log(file);
                const colRef = collection(docRef.chatDocRef, "message");
                await addDoc(colRef, {
                    message: file,
                    uid: userCredential.uid,
                    date: new Date().toISOString(),
                });
            });
        }
        setListFilesSendURL([]);
    }

    return (
        <div className='Chatbox'>
            {docRef ? 
            (<><Modals open={showModal} onClose={setShowModal} onSetFiles={setListFiles} uploadValue={uploadValue} messageFile={messageFile} onSendFiles={onSendFiles}/>
            <div className='chatbox-info-container'>
                {(sender?.user1.uid === userCredential?.uid) ? (
                <>
                    <div>
                        <img className='sidebar-image-perfil' src={sender?.user2.photoURL} alt="Perfil" />
                    </div>
                    <div className='chatbox-info-container-div-name'>
                        <h3>{sender?.user2.name}</h3>
                    </div>
                </>
                ):(
                <>
                    <div>
                        <img className='sidebar-image-perfil' src={sender?.user1.photoURL} alt="Perfil" />
                    </div>
                    <div className='chatbox-info-container-div-name'>
                        <h3>{sender?.user1.name}</h3>
                    </div>
                </>
                )}
            </div>
            <div className='chatbox-container'>
                <ScrollToBottom className='chatbox-scroll-container'>
                    {listMessage.map((message, index) => {
                        if(message.uid === userCredential.uid){
                            //console.log(message.date);
                            return(
                                <div key={index} className='chatbox-message-user'>
                                    {
                                        typeof(message.message) === "string" ? (<span className='chatbox-message'>{message.message}{/*<span className='chatbox-message-timer'>{message.date}</span>*/}</span>):
                                        (message.message.typeFile === "image" ? (<img className='chatbox-message-files' src={message.message.urlFile} alt=""></img>):
                                        (message.message.typeFile === "audio" ? (<audio className='chatbox-message-files' controls><source src={message.message.urlFile} type="audio/mpeg"/></audio>):
                                        (message.message.typeFile === "video" ? (<video width="320" height="240" controls><source src={message.message.urlFile} type="video/mp4"/></video>):
                                        (<object className='chatbox-message-files' data={message.message.urlFile} type="application/pdf" width="320" height="240">
                                        <p>Alternative text - include a link <a href={message.message.urlFile}>to the PDF!</a></p></object>))))
                                    }
                                </div>
                            )
                        }else{
                            return(
                                <div key={index} className='chatbox-incoming-message-user'>
                                    {
                                        typeof(message.message) === "string" ? (<span className='chatbox-message-incoming'>{message.message}{/*<span className='chatbox-message-timer'>{message.date}</span>*/}</span>):
                                        (message.message.typeFile === "image" ? (<img className='chatbox-message-files' src={message.message.urlFile} alt=""></img>):
                                        (message.message.typeFile === "audio" ? (<audio className='chatbox-message-files' controls><source src={message.message.urlFile} type="audio/mpeg"/></audio>):
                                        (message.message.typeFile === "video" ? (<video width="320" height="240" controls><source src={message.message.urlFile} type="video/mp4"/></video>):
                                        (<object className='chatbox-message-files' data={message.message.urlFile} type="application/pdf" width="320" height="240">
                                        <p>Alternative text - include a link <a href={message.message.urlFile}>to the PDF!</a></p></object>))))
                                    }
                                </div>
                            )
                        }
                    })}
                </ScrollToBottom>
            </div>
            <form onSubmit={onSend} className='chatbox-form-container'>
                <div className='chatbox-form-div'>
                    <div onClick={() => {
                                        setShowModal(true);
                                    }} 
                            className='chatbox-form-button'>
                        <FiPaperclip className='chatbox-send'/>
                    </div>
                    <div className='chatbox-form-div-container'>
                        <input value={value} onChange={(e)=>{ 
                            e.preventDefault(); 
                            setValue(e.target.value);
                        }} type='text' className='chatbox-form-input' placeholder='Enviar mensaje'/>  
                    </div>
                    <div onClick={(e) => {
                        onSend(e);
                    }} className='chatbox-form-button'>
                        <MdSend className='chatbox-send'/>
                    </div>
                </div>
            </form></>):(<>
                            <div className='chatbox-chat-container'>
                                <RiWechatLine className='chatbox-chat'/>
                                <span className='chatbox-chat-text'>WhatUP?</span>
                            </div>
                        </>)
            }
        </div>
    )
}

export default Chatbox