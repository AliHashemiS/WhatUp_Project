import React from 'react';
import '../styles/login.css'
import { useDispatch } from 'react-redux';
import { bindActionCreators } from 'redux';
import { authActions } from '../state';
import { useNavigate } from 'react-router-dom';

const Login = () => {

    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { googleSignIn: loginGoogle } = bindActionCreators(
        authActions,
        dispatch
    );

    const googleSignIn = async () => {
        try {
            await loginGoogle();
            navigate('/whatup');
        } catch (error) {
            console.log(error);
        }
    };

    return (
        <div className='Login'>
            <div className='login-container'>
                <div className="login-div-center">
                    <h1>Login</h1>
                </div>
                <div className="google-btn" onClick={googleSignIn}>
                    <div className="google-icon-wrapper">
                        <img
                        alt="google-logo"
                        className="google-icon"
                        src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg"
                        />
                    </div>
                    <p className="login-btn-text">
                        <b>Iniciar con google</b>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Login