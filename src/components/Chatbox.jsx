import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react'
import { MdSend } from 'react-icons/md';
import { FiPaperclip } from 'react-icons/fi';
import { RiWechatLine } from "react-icons/ri";
import { IoMdTimer } from "react-icons/io";
import { useSelector } from 'react-redux';
import ScrollToBottom from 'react-scroll-to-bottom';
import { AES, enc } from "crypto-js";

import '../styles/chatbox.css'
import Modals from './Modals';
import { storage } from '../firebase/firebase';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';

const Chatbox = () => {
    const [value, setValue] = useState("");
    const [reminderBox, setReminderBox] = useState(false);
    const [listMessage, setlistMessage] = useState([]);
    const [sender, setSender] = useState();
    const [showModal, setShowModal] = useState(false);
    const [listFiles, setListFiles] = useState([]);
    const [listFilesSendURL, setListFilesSendURL] = useState([]);
    const [listReminderMessage, setListReminderMessage] = useState([]);
    const [uploadValue, setUploadValue] = useState(0);
    const [messageFile, setMessageFile] = useState("");
    const [timeReminder, setTimeReminder] = useState();

    const userCredential = useSelector((state) => state.auth.userCredentials);
    const docRef = useSelector((state) => state?.chat.chatCredentials);


    useEffect(() => {
        console.log("entro al useEffect");
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

    useEffect(() => {
        if(listReminderMessage.length !== 0){
            console.log("entro al useEffect xd");
            let timeRange;
            let timeOut;  
            let time =  new Date();    
            listReminderMessage.forEach((reminderMsg) => {
                timeRange = ((reminderMsg.date.seconds*1000) - time.getTime());
                timeOut = setTimeout( async () => {

                    const colRef = collection(docRef?.chatDocRef, "message");

                    await setDoc(doc(colRef, reminderMsg.id), {
                        message: reminderMsg.message,
                        uid: userCredential?.uid,
                        date: new Date().toISOString(),
                        type: "string"
                    });

                    let db = collection(docRef?.chatDocRef, "reminder");
                    await deleteDoc(doc(db, reminderMsg.id));
                    setListReminderMessage([]);

                }, timeRange);
            }); 
            return () => {clearTimeout(timeOut);}
        }
    }, [listReminderMessage, docRef?.chatDocRef, userCredential?.uid]);

    const onSend = async (e) => {
        e.preventDefault();
        if(value){       
            const colRef = collection(docRef?.chatDocRef, "message");

            let encrypted = AES.encrypt(value, "E1F53135E559C253").toString();

            await addDoc(colRef, {
                message: encrypted,
                uid: userCredential.uid,
                date: new Date().toISOString(),
                type: "string"
            });
        } 
        setValue("");
    }

    const onSendFiles = () => {
        if (listFilesSendURL.length !== 0){
            listFilesSendURL.forEach( async (file) => {
                const colRef = collection(docRef?.chatDocRef, "message");

                let encrypted = AES.encrypt(JSON.stringify(file), "E1F53135E559C253").toString();

                await addDoc(colRef, {
                    message: encrypted,
                    uid: userCredential.uid,
                    date: new Date().toISOString(),
                    type: "object"
                });
            });
        }
        setListFilesSendURL([]);
    }

    const onSendMessageReminder = async () => {
        if(value){
            const colRef = collection(docRef?.chatDocRef, "reminder");

            let encrypted = AES.encrypt(value, "E1F53135E559C253").toString();

            await addDoc(colRef, {
                message: encrypted,
                uid: userCredential.uid,
                date: timeReminder,
                type: "string"
            });

            
            const unsubscribe = onSnapshot(collection(docRef?.chatDocRef, "reminder"), (snapshot) => {
                let listTemp = [];
                snapshot.docChanges().forEach((change) => {
                    listTemp.push({...change.doc.data(), id:change.doc.id});
                });
                setListReminderMessage(listTemp);
                setValue("");
            });
            return unsubscribe;
        }
    }

    return (
        <div className='Chatbox'>
            {docRef ? 
            (<><Modals open={showModal} onClose={setShowModal} onSetFiles={setListFiles} uploadValue={uploadValue} messageFile={messageFile} onSendFiles={onSendFiles} functionReminder={onSendMessageReminder} dateReminder={setTimeReminder} reminder={reminderBox}/>
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

                        var objectBytes = AES.decrypt(message.message, "E1F53135E559C253");
                        let decrypted;

                        if(message.type === "string"){
                            decrypted = objectBytes.toString(enc.Utf8);
                        }else{
                            decrypted = JSON.parse(objectBytes.toString(enc.Utf8));
                        }

                        if(message.uid === userCredential.uid){              
                            return(
                                <div key={index} className='chatbox-message-user'>
                                    {
                                        (message.type === "string") ? (<span className='chatbox-message'>{decrypted}{/*<span className='chatbox-message-timer'>{message.date}</span>*/}</span>):
                                        (decrypted.typeFile === "image" ? (<img className='chatbox-message-files' src={decrypted.urlFile} alt=""></img>):
                                        (decrypted.typeFile === "audio" ? (<audio className='chatbox-message-files' controls><source src={decrypted.urlFile} type="audio/mpeg"/></audio>):
                                        (decrypted.typeFile === "video" ? (<video width="320" height="240" controls><source src={decrypted.urlFile} type="video/mp4"/></video>):
                                        (<object className='chatbox-message-files' data={decrypted.urlFile} type="application/pdf" width="320" height="240">
                                        <p>Alternative text - include a link <a href={decrypted.urlFile}>to the PDF!</a></p></object>))))
                                    }
                                </div>
                            )
                        }else{
                            return(
                                <div key={index} className='chatbox-incoming-message-user'>
                                    {
                                        (message.type === "string") ? (<span className='chatbox-message-incoming'>{decrypted}{/*<span className='chatbox-message-timer'>{message.date}</span>*/}</span>):
                                        (decrypted.typeFile === "image" ? (<img className='chatbox-message-files' src={decrypted.urlFile} alt=""></img>):
                                        (decrypted.typeFile === "audio" ? (<audio className='chatbox-message-files' controls><source src={decrypted.urlFile} type="audio/mpeg"/></audio>):
                                        (decrypted.typeFile === "video" ? (<video width="320" height="240" controls><source src={decrypted.urlFile} type="video/mp4"/></video>):
                                        (<object className='chatbox-message-files' data={decrypted.urlFile} type="application/pdf" width="320" height="240">
                                        <p>Alternative text - include a link <a href={decrypted.urlFile}>to the PDF!</a></p></object>))))
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
                                        setReminderBox(true);
                                        setShowModal(true);
                                    }} 
                            className='chatbox-form-button'>
                        <IoMdTimer className='chatbox-send'/>
                    </div>
                    <div onClick={() => {
                                        setReminderBox(false);
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