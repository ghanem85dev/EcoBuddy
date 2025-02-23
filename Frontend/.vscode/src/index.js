import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { AuthProvider } from './context/AuthContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { BrowserRouter } from 'react-router-dom'; // Import BrowserRouter
/* global FB */

// Ensure FB SDK is loaded before using it
window.fbAsyncInit = function() {
  window.FB.init({
    appId: '604000669075467', // Remplacez par votre Facebook App ID
    cookie: true,
    xfbml: true,
    version: 'v18.0'
  });
  window.FB.AppEvents.logPageView();
};


// Load the SDK script dynamically
(function(d, s, id) {
  var js, fjs = d.getElementsByTagName(s)[0];
  if (d.getElementById(id)) return;
  js = d.createElement(s); js.id = id;
  js.src = "https://connect.facebook.net/en_US/sdk.js";
  fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId="104107465263-v7mlmu7q301eula8lbr8l176ngs3gslt.apps.googleusercontent.com">
      <AuthProvider>
        <BrowserRouter> {/* Ajout du Router ici */}
          <App />
        </BrowserRouter>
      </AuthProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);

reportWebVitals();