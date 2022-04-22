import React, { useState } from 'react'
import '../styles/sidebar.css'
import { MdLogout, MdSearch, MdClose } from "react-icons/md";
import { ImUserPlus } from "react-icons/im"
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { bindActionCreators } from 'redux';
import { authActions, chatActions } from '../state';
import { db } from '../firebase/firebase';
import { addDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { toast } from "react-toastify";
import ChatIndex from './ChatIndex';

const Sidebar = () => {
    const [searchValue, setSearchValue] = useState("");
    const [createChat, setCreateChat] = useState("transparent");
    const [listChats, setListChats] = useState([]);
    const [listChatsRecover, setListChatsRecover] = useState([]);
    const userCredential = useSelector((state) => state.auth.userCredentials);

    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { logout } = bindActionCreators(authActions, dispatch); 
    const { getChatUid } = bindActionCreators(chatActions, dispatch);

    const onSearch = () => {
        if(searchValue){
            let listTemp = [];
            setListChatsRecover(listChats);
            listChats.forEach((data) => {
                if(data.data().user1.uid === userCredential.uid){
                    if(data.data().user2.name.toLowerCase().includes(searchValue.toLowerCase())){
                        console.log(data.data().user2.name.toLowerCase());
                        listTemp.push(data);
                    }else if(data.data().user2.email.toLowerCase().includes(searchValue.toLowerCase())){
                        console.log(data.data().user2.email.toLowerCase());
                        listTemp.push(data);
                    }
                }else if(data.data().user2.uid === userCredential.uid){
                    if(data.data().user1.name.toLowerCase().includes(searchValue.toLowerCase())){
                        console.log(data.data().user1.name.toLowerCase());
                        listTemp.push(data);
                    }else if(data.data().user1.email.toLowerCase().includes(searchValue.toLowerCase())){
                        console.log(data.data().user1.email.toLowerCase());
                        listTemp.push(data);
                    }
                }
            })
            setListChats(listTemp);
        }
    }

    const onSearchUser = async () => {
        if(searchValue){
            const queryUser = query(collection(db, "users"), where("email", "==", searchValue));
            const response = await getDocs(queryUser);
            console.log(response.size);
            response.forEach((doc) => {
                onCreateChat(doc.data());
                console.log("success");
                toast.success("The chat was created successfully!");
            });
            if(response.size === 0) {
                toast.error("Error, the email does not exist!");
            }
            setCreateChat("transparent");
        }
    }

    const onCreateChat = async (sender) => {
        const queryChat1 = query(collection(db, "chats"), where("user1.uid", "==", userCredential.uid), where("user2.uid", "==", sender.uid));
        const queryChat2 = query(collection(db, "chats"), where("user1.uid", "==", sender.uid), where("user2.uid", "==", userCredential.uid));
        const response1 = await getDocs(queryChat1);
        const response2 = await getDocs(queryChat2);
        if(response1.size === 1){
            console.log("response1");
            response1.forEach((doc) => {
                getChatUid(doc.id);
            });
        } else if(response2.size === 1){
            console.log("response2");
            response2.forEach((doc) => {
                getChatUid(doc.id);
            });
        }else{
            console.log("no exite chat");
            let chat = {
                user1: userCredential,
                user2: sender,
                date: new Date().toISOString(),
            };
    
            const docRef = await addDoc(collection(db, 'chats'), chat);
            getChatUid(docRef.id);
        }
        allChatUser();
    }

    const allChatUser = async () => {
        const queryChat1 = query(collection(db, "chats"), where("user1.uid", "==", userCredential.uid));
        const queryChat2 = query(collection(db, "chats"), where("user2.uid", "==", userCredential.uid));
        const response1 = await getDocs(queryChat1);
        const response2 = await getDocs(queryChat2);
        let listContact = [];
        if(response1.size !== 0){
            console.log("response1");
            response1.forEach((doc) => {
                listContact.push(doc);
            });
        } 
        if(response2.size !== 0){
            console.log("response2");
            response2.forEach((doc) => {
                listContact.push(doc);
            });
        }
        setListChats(listContact);
    }

    return (
        <div onLoad={allChatUser} className='Sidebar'>
            <div className='sidebar-info-container'>
                <div className='sidebar-image-container'>
                    <img className='sidebar-image-perfil' src={userCredential?.photoURL} alt="Perfil" />
                </div>
                <div className='sidebar-chat-container'>
                    <button onClick={() => {
                                        if(createChat === "transparent"){
                                            setCreateChat("rgb(185, 185, 185)");
                                            
                                        }else{
                                            setCreateChat("transparent");
                                        }
                                    }} 
                            className='sidebar-chat-button'
                            style={{backgroundColor:createChat}}>
                        <ImUserPlus size={"1.4em"} className='sidebar-chat'/>
                    </button>
                </div> 
                <div className='sidebar-logout-container'>
                    <button onClick={() => {
                                        logout();
                                        navigate("/");
                                    }} 
                            className='sidebar-logout-button'>
                        <MdLogout size={"1.4em"} className='sidebar-logout'/>
                    </button>
                </div> 
            </div>
            <div className='sidebar-filter-container'>
                <div className='sidebar-filterinput-container'>
                    <MdSearch size={"1.4em"} className='sidebar-search'/>
                    <input 
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                if(createChat === "transparent"){
                                    onSearch()
                                }else{
                                    onSearchUser();
                                }     
                            }
                        }} 
                        onChange={(e) => {
                            setSearchValue(e.target.value);
                            if(e.target.value === ""){
                                setListChats(listChatsRecover);
                            }
                        }}
                        value={searchValue} 
                        placeholder="example@gmail.com"
                        className='sidebar-input-filter'/>
                    {searchValue ? (<MdClose onClick={() => {
                        setListChats(listChatsRecover);
                        setSearchValue("");
                    }} size={"1.4em"} className='sidebar-close'/>):null}
                </div>
            </div>
            <div className='sidebar-contacts-container'>
                {listChats.map((chat, index) => {
                    if(chat.data().user1.uid !== userCredential.uid){
                        return <ChatIndex key={index} docRef={chat} userName={chat?.data().user1.name} userEmail={chat?.data().user1.email} photoURL={chat?.data().user1.photoURL}/>
                    } 
                    if (chat.data().user2.uid !== userCredential.uid){
                        return <ChatIndex key={index} docRef={chat} userName={chat?.data().user2.name} userEmail={chat?.data().user2.email} photoURL={chat?.data().user2.photoURL}/>
                    }
                    return null;
                })}
            </div>
        </div>
    )
}

export default Sidebar