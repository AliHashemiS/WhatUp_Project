import { addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, orderBy, query, setDoc, updateDoc, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react'
import { MdSend, MdOutlineAutoDelete } from 'react-icons/md';
import { FiPaperclip } from 'react-icons/fi';
import { MdOutlineDeleteSweep, MdAppBlocking, MdEdit, MdClose } from 'react-icons/md';
import { RiWechatLine, RiSearchLine, RiDeleteBack2Line } from "react-icons/ri";
import { IoMdTimer } from "react-icons/io";
import { useSelector } from 'react-redux';
import ScrollToBottom from 'react-scroll-to-bottom';
import { AES, enc } from "crypto-js";
import '../styles/chatbox.css'
import Modals from './Modals';
import { db, storage } from '../firebase/firebase';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import $ from 'jquery';
import Datetime from './Datetime';

const Chatbox = () => {
    const [value, setValue] = useState("");
    const [searchValue, setSearchValue] = useState("");
    const [dateSearchValue, setDateSearchValue] = useState(new Date());
    const [reminderBox, setReminderBox] = useState(false);
    const [destroyBox, setDestroyBox] = useState(false);
    const [listMessage, setlistMessage] = useState([]);
    const [sender, setSender] = useState();
    const [showModal, setShowModal] = useState(false);
    const [listFiles, setListFiles] = useState([]);
    const [listFilesSendURL, setListFilesSendURL] = useState([]);
    const [listReminderMessage, setListReminderMessage] = useState([]);
    const [listDestroyMessage, setListDestroyMessage] = useState([]);
    const [uploadValue, setUploadValue] = useState(0);
    const [messageFile, setMessageFile] = useState("");
    const [timeReminder, setTimeReminder] = useState();
    const [editMessage, setEditMessage] = useState("");
    const [editMessageObj, setEditMessageObj] = useState("");
    const [blockChatCondition, setBlockChatCondition] = useState();
    const [docRefBlock, setDocRefBlock] = useState();
    const [listFilteredMessage, setlistFilteredMessage] = useState([]);

    var userList = ["chechex89@gmail.com", "alitechs03@gmail.com", "leandro.vasvega@gmail.com"];
    const [listMessageBot, setListMessageBot] = useState(["Hola, elige una opción: \n1- Enviar mensaje Reminder \n2- Consultar el clima \n3- Búsqueda rápida en Google \n(Envía 1,2 o 3 según lo que quieras)"]);
    const [currentPetition, setCurrentPetition] = useState("");
    const [iamBot, setIamBot] = useState(false);

    const userCredential = useSelector((state) => state.auth.userCredentials);
    const docRef = useSelector((state) => state?.chat.chatCredentials);


    useEffect(() => {
        console.log("entro al useEffect");
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

    useEffect(() => {
        if(listDestroyMessage.length !== 0){
            console.log("entro al useEffect xd");
            let timeRange;
            let timeOut;  
            let time =  new Date();    
            listDestroyMessage.forEach((reminderMsg) => {
                if(reminderMsg.dateDestroy){
                    timeRange = ((reminderMsg.dateDestroy.seconds*1000) - time.getTime());
                    timeOut = setTimeout( async () => {
    
                        const colRef = collection(docRef?.chatDocRef, "message");
                        await deleteDoc(doc(colRef, reminderMsg.id));
                        setListDestroyMessage([]);
    
                    }, timeRange);
                }
            }); 
            return () => {clearTimeout(timeOut);}
        }
    }, [listDestroyMessage, docRef?.chatDocRef, userCredential?.uid]);

    const onSend = async (e) => {
        e.preventDefault();

        if(iamBot){
            if(value){
                sendMessage(value);
            }   
        }else{
            const queryChat1 = query(collection(db, 'users'), where("uid", "==", userCredential.uid));
            const response1 = await getDocs(queryChat1);

            if(editMessage){
                onEdit(editMessageObj, value);
                setEditMessage("");
                setEditMessageObj("");
            }else if(value){       
                const colRef = collection(docRef?.chatDocRef, "message");

                let encrypted = AES.encrypt(value, "E1F53135E559C253").toString();

                
                await addDoc(colRef, {
                    message: encrypted,
                    uid: userCredential.uid,
                    date: new Date().toISOString(),
                    type: "string"
                });

                if(response1.size){
                    response1.forEach(async (doc) => {
                        await updateDoc(doc.ref, {
                            numbMessage: (doc.data().numbMessage + 1)
                        });
                    });
                }
            } 
        }
        
        setValue("");
    }

    const onSendFiles = () => {
        const queryChat1 = query(collection(db, 'users'), where("uid", "==", userCredential.uid));

        if (listFilesSendURL.length !== 0){
            listFilesSendURL.forEach( async (file) => {
                const response1 = await getDocs(queryChat1);
                const colRef = collection(docRef?.chatDocRef, "message");

                let encrypted = AES.encrypt(JSON.stringify(file), "E1F53135E559C253").toString();

                if(file.typeFile === 'image'){
                    if(response1.size){
                        response1.forEach(async (doc) => {
                            await updateDoc(doc.ref, {
                                numbImage: (doc.data().numbImage + 1)
                            });
                        });
                    }
                } else if(file.typeFile === 'audio'){
                    if(response1.size){
                        response1.forEach(async (doc) => {
                            await updateDoc(doc.ref, {
                                numbAudio: (doc.data().numbAudio + 1)
                            });
                        });
                    }
                } else if(file.typeFile === 'video'){
                    if(response1.size){
                        response1.forEach(async (doc) => {
                            await updateDoc(doc.ref, {
                                numbVideo: (doc.data().numbVideo + 1)
                            });
                        });
                    }
                } else {
                    if(response1.size){
                        response1.forEach(async (doc) => {
                            await updateDoc(doc.ref, {
                                numbPDF: (doc.data().numbPDF + 1)
                            });
                        });
                    }
                }

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

        if(iamBot){
            sendMessage(value);
        }

        const queryChat1 = query(collection(db, 'users'), where("uid", "==", userCredential.uid));
        const response1 = await getDocs(queryChat1);
        
        if(value){
            const colRef = collection(docRef?.chatDocRef, "reminder");

            let encrypted = AES.encrypt(value, "E1F53135E559C253").toString();

            await addDoc(colRef, {
                message: encrypted,
                uid: userCredential.uid,
                date: timeReminder,
                type: "string"
            });

            if(response1.size){
                response1.forEach(async (doc) => {
                    await updateDoc(doc.ref, {
                        numbMessage: (doc.data().numbMessage + 1)
                    });
                });
            }
            
            const unsubscribe = onSnapshot(colRef, (snapshot) => {
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

    const onSendMessageDestroy = async () => {

        const queryChat1 = query(collection(db, 'users'), where("uid", "==", userCredential.uid));
        const response1 = await getDocs(queryChat1);
        
        if(value){
            const colRef = collection(docRef?.chatDocRef, "message");

            let encrypted = AES.encrypt(value, "E1F53135E559C253").toString();

            await addDoc(colRef, {
                message: encrypted,
                uid: userCredential.uid,
                date: new Date().toISOString(),
                dateDestroy: timeReminder,
                type: "string"
            });

            if(response1.size){
                response1.forEach(async (doc) => {
                    await updateDoc(doc.ref, {
                        numbMessage: (doc.data().numbMessage + 1)
                    });
                });
            }
            
            const unsubscribe = onSnapshot(colRef, (snapshot) => {
                let listTemp = [];
                snapshot.docChanges().forEach((change) => {
                    listTemp.push({...change.doc.data(), id:change.doc.id});
                });
                setListDestroyMessage(listTemp);
                setValue("");
            });
            return unsubscribe;
        }
    }

    const onDelete = async (msg) => {
        const colRef = collection(docRef?.chatDocRef, "message");

        const queryChat1 = query(colRef, where("date", "==", msg.date), where("message", "==", msg.message));
        const response1 = await getDocs(queryChat1);

        if(response1.size){
            response1.forEach(async (doc) => {
                await deleteDoc(doc.ref);
            });
        }
    }

    const onEdit = async (msg, msgValue) => {
        const colRef = collection(docRef?.chatDocRef, "message");
        let encrypted = AES.encrypt(msgValue, "E1F53135E559C253").toString();

        const queryChat1 = query(colRef, where("date", "==", msg.date), where("message", "==", msg.message));
        const response1 = await getDocs(queryChat1);

        if(response1.size){
            response1.forEach(async (doc) => {
                await updateDoc(doc.ref, {
                    message: encrypted
                });
            });
        }
    }

    const onBlockUser = async () => {

        if(docRefBlock){
            if(blockChatCondition){
                setBlockChatCondition(false);
                await updateDoc(docRefBlock, {
                    block: false 
                });
            }else{
                setBlockChatCondition(true);
                await updateDoc(docRefBlock, {
                    block: true 
                });
            }
        }
    }

    useEffect(() => {
        async function onBlockChat() {
            if(sender){
                const queryChat1 = query(collection(db, "chats"), where("user1.uid", "==", sender?.user1.uid), where("user2.uid", "==", sender?.user2.uid));
                const response1 = await getDocs(queryChat1);
                if(response1.size){
                    response1.forEach((doc) => {
                        setBlockChatCondition(doc.data().block);
                        setDocRefBlock(doc.ref);
                        return blockChatCondition;
                    });
                }
    
                const queryChat2 = query(collection(db, "chats"), where("user2.uid", "==", sender?.user1.uid), where("user1.uid", "==", sender?.user2.uid));
                const response2 = await getDocs(queryChat2);
                if(response2.size){
                    response2.forEach((doc) => {
                        setBlockChatCondition(doc.data().block);
                        setDocRefBlock(doc.ref);
                        return blockChatCondition;
                    });
                }
            } 
        }
        
        onBlockChat();
    }, [sender, blockChatCondition]);

    const giveFormatToDate = (date) => {
        const monthNames = ["enero", "febrero", "marzo", "abril", "mayo", "junio",
                                "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
                            ];
        const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", 
                                "Jueves", "Viernes", "Sábado"
                            ];
        
        var day = dayNames[date.getDay()];
        var month = monthNames[date.getMonth()];
        let minutes = date.getMinutes();
        if (minutes < 10) {
            minutes = "0" + minutes;
        }
        var timeHoursMinutes = date.getHours() + ":" + minutes;
        
        var fomattedDate = day + ", " + date.getDate() + " de " + month + " - " + timeHoursMinutes;
        return fomattedDate;
    }

    const getWeather = () =>{
        if (navigator && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(pos => {
            const coords = pos.coords;
                let latitude = coords.latitude.toString();
                let longitude = coords.longitude.toString();
                
                var url = 'https://api.openweathermap.org/data/2.5/weather?lat='+latitude+'&lon='+longitude+'&appid=d9a359371b6d947702e393a5ff067359&lang=es';
                
                $.get(url, (data) => {
                const description = data.weather[0].description;
                const wheatherDescription = description.charAt(0).toUpperCase() + description.slice(1);
                var display = data.name + ", " + (Math.trunc(data.main.temp / 10)) + " °C | " + giveFormatToDate(new Date()) + "\n" + 
                wheatherDescription + " • Humedad: " + data.main.humidity + "% • Presión: " + data.main.pressure + " mb";
                //Set the result to a State variable
                console.log(display);
                var tempList = listMessageBot;
                tempList.push(display);
                setListMessageBot(tempList);

                tempList = listMessageBot;
                var botMessage = "Hola, elige una opción:\n1- Enviar mensaje Reminder\n2- Consultar el clima\n3- Búsqueda rápida en Google\n(Envía 1,2 o 3 según lo que quieras)"
                tempList.push(botMessage);
                setListMessageBot(tempList);
                })
            });
        }
    }

    const googleResults = async (queryToBeDone) => {
        var resultList = [];
        let result = "";
        var GOOGLE_API_KEY = 'AIzaSyBSCvReAvT9yHzoa9nBDNbcj79DyKCKeMc'; //Google Custom Search API
        
        var url = 'https://www.googleapis.com/customsearch/v1?key=' + GOOGLE_API_KEY + '&cx=b9ccdccf8ab049119&q=' + queryToBeDone
        
        $.get(url, (data) => {
            console.log(data.items);
            result = "\t\tEstos son los 5 primeros resultados de la búsqueda:\n";
            data.items.splice(5);
            data.items.forEach(res => {
            result += '------------>>' + res.title + '<<------------\n' + 
            'URL: ' + res.link + ' \n' +
            'Snippet:' + res.snippet + "\n\n";
            });
            //resultList.push(result);
            console.log(result)
            var tempList = listMessageBot;
            tempList.push(result);
            setListMessageBot(tempList);

            tempList = listMessageBot;
            var botMessage = "Hola, elige una opción:\n1- Enviar mensaje Reminder\n2- Consultar el clima\n3- Búsqueda rápida en Google\n(Envía 1,2 o 3 según lo que quieras)"
            tempList.push(botMessage);
            setListMessageBot(tempList);
        });
        return resultList;
        }
        
    const sendMessage = (message) => {
        var tempList = listMessageBot;
        tempList.push(message);
        setListMessageBot(tempList);

        console.log("Current:", currentPetition)

        if (message === "1") {
            setCurrentPetition("");
            console.log("Disparar función 1");
            var m = "¿A cuál usuario quieres enviarle el mensaje (email del usuario)?"
            tempList.push(m);
            setCurrentPetition("check users");
        } else if (message === "2") {
            console.log("Disparar función 2");
            setCurrentPetition("");
            getWeather();
            return;
        } else if (message === "3") {
            console.log("Disparar función 3")
            setCurrentPetition("");
            var m1 = "¿Qué quieres buscar? (la búsqueda se hará en Google y Wikipedia)"
            tempList.push(m1);
            setCurrentPetition("do search");
        } else if (currentPetition === "check users") {
            if (userList.includes(message)){
                var m2 = "Ahora escribe el mensaje que quieres enviarle"
                tempList.push(m2);
                var m3 = "Luego, presiona el botón Reminder y selecciona la fecha, \nhora a la que quieres que se envíe el mensaje";
                tempList.push(m3);
                setCurrentPetition("ask for message");
            } else {
                var m4 = "El usuario que indicas no tiene WhatUp aún :( \nPor favor intenta con un usuario que esté registrado en WhatUp"
                tempList.push(m4);
                setCurrentPetition("check users");
            }
        } else if (currentPetition === "ask for message") {
            var botMessage = "Hola, elige una opción:\n1- Enviar mensaje Reminder\n2- Consultar el clima\n3- Búsqueda rápida en Google\n(Envía 1,2 o 3 según lo que quieras)"
            tempList.push(botMessage);
            setCurrentPetition("");
        } else if (currentPetition === "do search") {
            googleResults(message);
            setCurrentPetition("");
            return;
        } else {
            var failMessage = "Opción equivocada, por favor ingresa una opción correcta (1, 2 o 3...)";
            tempList = listMessageBot;
            tempList.push(failMessage);
        }
        setListMessageBot(tempList);
        console.log(listMessageBot);
        console.log("llego");
    }

    useEffect(() => {
        if(sender){
            if(sender?.user1.uid === "2Jeh6vreIscJRBJylJjDmW3HMM13" || sender?.user2.uid === "2Jeh6vreIscJRBJylJjDmW3HMM13"){
                setIamBot(true);
                console.log("soy bot");
                return;
            }
            setIamBot(false); 
        }
    }, [sender]);

    const decryptMessage = (message) => {
        var objectBytes = AES.decrypt(message.message, "E1F53135E559C253");
        let decrypted;
        if(message.type === "string"){
            decrypted = objectBytes.toString(enc.Utf8);
        }else{
            decrypted = JSON.parse(objectBytes.toString(enc.Utf8));
        }
    
        return decrypted;
    }
    
    const removeAccents = (str) => {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }
    
    const toDatetimeLocalString = (dateObject) => {
        /*
        *This method converts a Date object into a string with this format:
        *"1970-01-01T00:00:00.0"
        */
        let datetime_local;
    
        //----------------Date formating--------
        let dd = dateObject.getDate();
        if (dateObject.getDate() < 10) {
            dd = "0" + dd;
        }
        let mm = dateObject.getMonth() + 1;
        if (dateObject.getMonth() < 10) {
            mm = "0" + mm;
        }
        let aaaa = dateObject.getFullYear();
    
        let date = aaaa + "-" + mm + "-" + dd;

        datetime_local = date;
        return datetime_local;
    }

    const messageBrowser = () => {
        var filteredList = [];
        if (searchValue !== "") {
            var searchText = removeAccents(searchValue.toLowerCase());
            filteredList = listMessage.filter((message) => {
                var decrypted = decryptMessage(message);
                if (message.type === "string") {
                    var messageContent = removeAccents(decrypted).toLowerCase();
                    if (messageContent.includes(searchText)) {
                        return message;
                    }
                }
                else {
                    var urlInLowerCase = decrypted.urlFile.toLowerCase();
                    if (urlInLowerCase.includes(searchText)) {
                    console.log("¡¡¡El archivo que buscas sí existe!!!");
                    return message;
                    }
                }
                return null;
            });
            console.log(filteredList);
            setlistFilteredMessage(filteredList);
        }else if (dateSearchValue) {
          //Search by the date of the message
            var dateEntered = toDatetimeLocalString(dateSearchValue);
            filteredList = listMessage.filter((message) => {
            var messageDateWithOutTime = String(message.date).slice(0, 10);
            if (dateEntered === messageDateWithOutTime) {
                return message;
            }
            return null;
            });
            console.log(filteredList);
            setlistFilteredMessage(filteredList);
        }
    }

    return (
        <div className='Chatbox'>
            {docRef ? 
            (<><Modals open={showModal} onClose={setShowModal} onSetFiles={setListFiles} uploadValue={uploadValue} messageFile={messageFile} onSendFiles={onSendFiles} functionReminder={onSendMessageReminder} functionDestroy={onSendMessageDestroy} dateReminder={setTimeReminder} reminder={reminderBox} destroy={destroyBox}/>
            <div className='chatbox-info-container'>
                {(sender?.user1.uid === userCredential?.uid) ? (
                <div className='chatbox-info-data'>
                    <div className='chatbox-info-photo-name'>
                        <div className='chatbox-info-pn'>
                            <img className='sidebar-image-perfil' src={sender?.user2.photoURL} alt="Perfil"/>
                        </div>
                        <div className='chatbox-info-container-div-name'>
                            <h3>{sender?.user2.name}</h3>
                        </div>
                    </div>

                    <div className='chatbox-filter-setting'>
                        <input value={searchValue} onChange={(e)=>{ 
                                e.preventDefault(); 
                                setSearchValue(e.target.value);
                                messageBrowser();
                            }} 
                        type='text' className='chatbox-search-input' placeholder='Enviar mensaje'/>
                        
                        <Datetime dateReminder={setDateSearchValue} className="drop-file-form-input" styles={{color:"white"}}/>
                        <RiDeleteBack2Line className='chatbox-delete-filter' onClick={() => {setDateSearchValue(null); setSearchValue("")}}/>
                        <RiSearchLine className='chatbox-search-filter' onClick={() => messageBrowser()}/>
                    </div>

                    <div>
                        <MdAppBlocking 
                            onClick={() => {
                                onBlockUser();
                            }}  className='chatbox-block-user'/>
                    </div>
                </div>
                ):(
                <div className='chatbox-info-data'>
                    <div className='chatbox-info-photo-name'>
                        <div className='chatbox-info-pn'>
                            <img className='sidebar-image-perfil' src={sender?.user1.photoURL} alt="Perfil"/>
                        </div>
                        <div className='chatbox-info-container-div-name'>
                            <h3>{sender?.user1.name}</h3>
                        </div>
                    </div>

                    <div className='chatbox-filter-setting'>
                        <input value={searchValue} onChange={(e)=>{ 
                                e.preventDefault(); 
                                setSearchValue(e.target.value);
                                messageBrowser();
                            }} 
                        type='text' className='chatbox-search-input' placeholder='Enviar mensaje'/>
                        
                        <Datetime dateReminder={setDateSearchValue} className="drop-file-form-input" styles={{color:"white"}}/>
                        <RiDeleteBack2Line className='chatbox-delete-filter' onClick={() => {setDateSearchValue(null); setSearchValue("")}}/>
                        <RiSearchLine className='chatbox-search-filter' onClick={() => messageBrowser()}/>
                    </div>

                    <div>
                        <MdAppBlocking 
                            onClick={() => {
                                onBlockUser();
                            }}  className='chatbox-block-user'/>
                    </div>
                </div>
                )}
            </div>
            <div className='chatbox-container'>
                <ScrollToBottom className='chatbox-scroll-container'>
                    {!iamBot ? (!searchValue ? ( !dateSearchValue ? (listMessage.map((message, index) => {
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
                                        (message.type === "string") ? (<span className='chatbox-message'>{decrypted}</span>):
                                        (decrypted.typeFile === "image" ? (<img className='chatbox-message-files' src={decrypted.urlFile} alt=""></img>):
                                        (decrypted.typeFile === "audio" ? (<audio className='chatbox-message-files' controls><source src={decrypted.urlFile} type="audio/mpeg"/></audio>):
                                        (decrypted.typeFile === "video" ? (<video width="320" height="240" controls><source src={decrypted.urlFile} type="video/mp4"/></video>):
                                        (<object className='chatbox-message-files' data={decrypted.urlFile} type="application/pdf" width="320" height="240">
                                        <p>Alternative text - include a link <a href={decrypted.urlFile}>to the PDF!</a></p></object>))))
                                    }
                                    <MdOutlineDeleteSweep 
                                    onClick={() => {
                                        onDelete(message);
                                    }}  className='chatbox-delete-edit'/>
                                    <MdEdit 
                                    onClick={() => {
                                        setEditMessage(decrypted);
                                        setEditMessageObj(message);
                                    }}  className='chatbox-delete-edit'/>
                                </div>
                            )
                        }else{
                            return(
                                <div key={index} className='chatbox-incoming-message-user'>
                                    {
                                        (message.type === "string") ? (<span className='chatbox-message-incoming'>{decrypted}</span>):
                                        (decrypted.typeFile === "image" ? (<img className='chatbox-message-files' src={decrypted.urlFile} alt=""></img>):
                                        (decrypted.typeFile === "audio" ? (<audio className='chatbox-message-files' controls><source src={decrypted.urlFile} type="audio/mpeg"/></audio>):
                                        (decrypted.typeFile === "video" ? (<video width="320" height="240" controls><source src={decrypted.urlFile} type="video/mp4"/></video>):
                                        (<object className='chatbox-message-files' data={decrypted.urlFile} type="application/pdf" width="320" height="240">
                                        <p>Alternative text - include a link <a href={decrypted.urlFile}>to the PDF!</a></p></object>))))
                                    }        
                                </div>
                            )
                        }
                    })):(
                        listFilteredMessage.map((message, index) => {
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
                                            (message.type === "string") ? (<span className='chatbox-message'>{decrypted}</span>):
                                            (decrypted.typeFile === "image" ? (<img className='chatbox-message-files' src={decrypted.urlFile} alt=""></img>):
                                            (decrypted.typeFile === "audio" ? (<audio className='chatbox-message-files' controls><source src={decrypted.urlFile} type="audio/mpeg"/></audio>):
                                            (decrypted.typeFile === "video" ? (<video width="320" height="240" controls><source src={decrypted.urlFile} type="video/mp4"/></video>):
                                            (<object className='chatbox-message-files' data={decrypted.urlFile} type="application/pdf" width="320" height="240">
                                            <p>Alternative text - include a link <a href={decrypted.urlFile}>to the PDF!</a></p></object>))))
                                        }
                                        <MdOutlineDeleteSweep 
                                        onClick={() => {
                                            onDelete(message);
                                        }}  className='chatbox-delete-edit'/>
                                        <MdEdit 
                                        onClick={() => {
                                            setEditMessage(decrypted);
                                            setEditMessageObj(message);
                                        }}  className='chatbox-delete-edit'/>
                                    </div>
                                )
                            }else{
                                return(
                                    <div key={index} className='chatbox-incoming-message-user'>
                                        {
                                            (message.type === "string") ? (<span className='chatbox-message-incoming'>{decrypted}</span>):
                                            (decrypted.typeFile === "image" ? (<img className='chatbox-message-files' src={decrypted.urlFile} alt=""></img>):
                                            (decrypted.typeFile === "audio" ? (<audio className='chatbox-message-files' controls><source src={decrypted.urlFile} type="audio/mpeg"/></audio>):
                                            (decrypted.typeFile === "video" ? (<video width="320" height="240" controls><source src={decrypted.urlFile} type="video/mp4"/></video>):
                                            (<object className='chatbox-message-files' data={decrypted.urlFile} type="application/pdf" width="320" height="240">
                                            <p>Alternative text - include a link <a href={decrypted.urlFile}>to the PDF!</a></p></object>))))
                                        }        
                                    </div>
                                )
                            }
                        })
                        )):(
                        listFilteredMessage.map((message, index) => {
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
                                            (message.type === "string") ? (<span className='chatbox-message'>{decrypted}</span>):
                                            (decrypted.typeFile === "image" ? (<img className='chatbox-message-files' src={decrypted.urlFile} alt=""></img>):
                                            (decrypted.typeFile === "audio" ? (<audio className='chatbox-message-files' controls><source src={decrypted.urlFile} type="audio/mpeg"/></audio>):
                                            (decrypted.typeFile === "video" ? (<video width="320" height="240" controls><source src={decrypted.urlFile} type="video/mp4"/></video>):
                                            (<object className='chatbox-message-files' data={decrypted.urlFile} type="application/pdf" width="320" height="240">
                                            <p>Alternative text - include a link <a href={decrypted.urlFile}>to the PDF!</a></p></object>))))
                                        }
                                        <MdOutlineDeleteSweep 
                                        onClick={() => {
                                            onDelete(message);
                                        }}  className='chatbox-delete-edit'/>
                                        <MdEdit 
                                        onClick={() => {
                                            setEditMessage(decrypted);
                                            setEditMessageObj(message);
                                        }}  className='chatbox-delete-edit'/>
                                    </div>
                                )
                            }else{
                                return(
                                    <div key={index} className='chatbox-incoming-message-user'>
                                        {
                                            (message.type === "string") ? (<span className='chatbox-message-incoming'>{decrypted}</span>):
                                            (decrypted.typeFile === "image" ? (<img className='chatbox-message-files' src={decrypted.urlFile} alt=""></img>):
                                            (decrypted.typeFile === "audio" ? (<audio className='chatbox-message-files' controls><source src={decrypted.urlFile} type="audio/mpeg"/></audio>):
                                            (decrypted.typeFile === "video" ? (<video width="320" height="240" controls><source src={decrypted.urlFile} type="video/mp4"/></video>):
                                            (<object className='chatbox-message-files' data={decrypted.urlFile} type="application/pdf" width="320" height="240">
                                            <p>Alternative text - include a link <a href={decrypted.urlFile}>to the PDF!</a></p></object>))))
                                        }        
                                    </div>
                                )
                            }
                        })
                    )):(
                        listMessageBot.map( (message, index) => {
                            return(
                            <div key={index} className='chatbox-message-user'>
                                <pre className='chatbox-message'>{message}</pre>
                            </div>
                        )})  
                    )}
                </ScrollToBottom>
            </div>    
            
            <form onSubmit={onSend} className='chatbox-form-container'>
                <div className='chatbox-form-div'>
                    {blockChatCondition === false ?
                    (<div>
                        {editMessage && (
                            <div className='chatbox-edit-div'>
                                <span className='chatbox-snap-edit'>
                                    {editMessage}
                                </span>
                                <div className='chatbox-edit-div-x'> 
                                    <MdClose 
                                    onClick={() => {
                                        setEditMessage("");
                                        setEditMessageObj("");
                                    }}  className='chatbox-close-edit'/>
                                </div>
                            </div>
                        )}
                        <div className='chatbox-send-message'>
                        
                            <div onClick={() => {
                                                setReminderBox(false);
                                                setDestroyBox(true);
                                                setShowModal(true);
                                            }} 
                                    className='chatbox-form-button'>
                                <MdOutlineAutoDelete className='chatbox-send'/>
                            </div>
                            <div onClick={() => {
                                                setDestroyBox(false);
                                                setReminderBox(true);
                                                setShowModal(true);
                                            }} 
                                    className='chatbox-form-button'>
                                <IoMdTimer className='chatbox-send'/>
                            </div>
                            <div onClick={() => {
                                                setDestroyBox(false);
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
                                if(iamBot){
                                    console.log("se envio mensaje al bot");
                                    if(value){
                                        sendMessage(value);
                                    }          
                                }else{
                                    onSend(e);
                                }
                            }} className='chatbox-form-button'>
                                <MdSend className='chatbox-send'/>
                            </div>
                        </div> 
                    </div>):(<div className='chatbox-block-chat'>
                    <span> 
                        X_User Blocked_X
                    </span>
                    </div>)}                   
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

export default Chatbox;