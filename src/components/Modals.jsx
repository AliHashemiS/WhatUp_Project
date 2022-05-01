import React, { useState } from 'react'
import DropFileInput from './DropFileInput';
import ReactDom from "react-dom";
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import '../styles/drop-file-input.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import Datetime from './Datetime';

const Modals = ({open, onClose, onSetFiles, uploadValue, messageFile, onSendFiles, functionReminder, dateReminder, reminder}) => {

    const [listFiles, setListFiles] = useState([]);
    //const [value, setValue] = useState("");

    const onFileChange = (files) => {
        setListFiles(files);
    }

    const onCloseModal = () => {
        setListFiles([]);
        onClose(false); 
    }

    const onSend = () => {
        onSetFiles(listFiles);
        onSendFiles();
        setListFiles([]);
        //onClose(false); 
    }

    return ReactDom.createPortal(
        <>
            <Modal
                show={open}
                onHide={() => onCloseModal()}
                backdrop="static"
                keyboard={false}
            >
                <Modal.Header closeButton>
                    <Modal.Title>Upload Files</Modal.Title>
                </Modal.Header>
                <Modal.Body className='d-flex align-items-center flex-column'>
                    {reminder === true ? 
                    (<>
                        <Datetime dateReminder={dateReminder} className="drop-file-form-input"/>
                    </>):
                    (<>
                        <span>{messageFile}</span>
                        <progress value={uploadValue} max='100'></progress>
                        <DropFileInput onFileChange={(files) => onFileChange(files)}/>    
                    </>)}
                    
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => onCloseModal()}>
                        Close
                    </Button>
                    <Button variant="primary" 
                    onClick={() => {
                                if(reminder){
                                    onClose(false); 
                                    functionReminder();
                                }else{
                                    onSend();
                                }
                            }}>
                        Send
                    </Button>
                </Modal.Footer>
            </Modal>
        </>,
        document.getElementById("portal")
    );
}

export default Modals