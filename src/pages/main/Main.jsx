import React from 'react'
import Chatbox from '../../components/Chatbox';
import Siderbar from '../../components/Siderbar';
import './main.css'

const Main = () => {
    
    return (
        <div className='Main'>
            <Siderbar/>
            <Chatbox/>
        </div>
    )
}

export default Main