import React from 'react'
import Chatbox from '../../components/Chatbox';
import Sidebar from '../../components/Sidebar';
import './main.css'

const Main = () => {
    
    return (
        <div className='Main'>
            <Sidebar/>
            <Chatbox/>
        </div>
    )
}

export default Main