import React, { useState } from 'react'
import '../styles/sidebar.css'
import { MdLogout, MdSearch, MdClose } from "react-icons/md";
import { ImUserPlus } from "react-icons/im"
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { bindActionCreators } from 'redux';
import { authActions } from '../state';
import { db } from '../firebase/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

const Sidebar = () => {
    const [searchValue, setSearchValue] = useState("");
    const [createChat, setCreateChat] = useState("transparent");
    const userCredential = useSelector((state) => state.auth.userCredentials);

    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { logout } = bindActionCreators(authActions, dispatch); 

    const onSearch = () => {
        if(searchValue){
            console.log(searchValue);
        }
    }

    const onSearchUser = async () => {
        if(searchValue){
            const queryUser = query(collection(db, "users"), where("email", "==", searchValue));
            const response = await getDocs(queryUser);
            console.log(response.size);
            setCreateChat("transparent");
        }
    }

    return (
        <div className='Sidebar'>
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
            <div className='sideba-filter-container'>
                <div className='sideba-filterinput-container'>
                    <MdSearch size={"1.4em"} className='sideba-search'/>
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
                        onChange={(e) => setSearchValue(e.target.value)} 
                        value={searchValue} 
                        placeholder="example@gmail.com"
                        className='sidebar-input-filter'/>
                    {searchValue ? (<MdClose onClick={() => {
                        setSearchValue("");
                    }} size={"1.4em"} className='sidebar-close'/>):null}
                </div>
            </div>
            <div className='sidebar-contacts-container'>
                x
            </div>
        </div>
    )
}

export default Sidebar