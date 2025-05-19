import React, { useState, useEffect, useRef,useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../commun/layouts/header';
import { Sidebar } from '../../commun/layouts/SideBar';
import { useTheme } from '../../commun/context/ThemeContext';
import axios from 'axios';
import '../styles/ChatbotPage.css';
import { AuthContext } from "../../commun/context/AuthContext";


const ChatbotPage = () => {
  const { theme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const { idUser } = useContext(AuthContext);

  // URL de votre serveur Rasa
  const RASA_API_URL = 'http://localhost:8000/api/chatbot';
  // URL de votre API FastAPI
  const FASTAPI_URL = 'http://localhost:8000/conversations/';

  // Effet pour scroller vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Charger l'historique des conversations
  useEffect(() => {
    if (!idUser) return;
    
    const fetchConversationHistory = async () => {
      try {
        const response = await axios.get(`${FASTAPI_URL}${idUser}`);
        setMessages(response.data.map(msg => ({
          text: msg.message,
          sender: msg.sender_type, // Utilisez directement sender_type
          timestamp: new Date(msg.timestamp).toLocaleTimeString(),
          image: msg.image || null
        })));
      } catch (error) {
        console.error("Erreur historique:", error);
      }
    };

    fetchConversationHistory();
  }, [idUser]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || !idUser) return;

    // Message utilisateur
    const userMessage = {
      text: inputMessage,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      // Sauvegarde du message utilisateur
      await axios.post(FASTAPI_URL, {
        sender_id: idUser,
        message: inputMessage,
        sender_type: 'user',
        timestamp: new Date().toISOString(),
      });

      // Envoi à Rasa et traitement réponse
      const rasaResponse = await axios.post(RASA_API_URL, {
        sender: idUser,
        message: inputMessage,
      });

      if (rasaResponse.data?.length > 0) {
        // Sauvegarde chaque réponse du bot
        for (const resp of rasaResponse.data) {
          const botMessage = {
            sender_id: idUser,
            message: resp.text,
            sender_type: 'bot',
            timestamp: new Date().toISOString(),
            image: resp.image || null
          };
          
          // Sauvegarde en base
          await axios.post(FASTAPI_URL, botMessage);
          
          // Ajout à l'état local
          setMessages(prev => [...prev, {
            text: resp.text,
            sender: 'bot',
            timestamp: new Date().toLocaleTimeString(),
            image: resp.image || null
          }]);
        }
      }
    } catch (error) {
      console.error('Erreur:', error);
      setMessages(prev => [...prev, {
        text: "Erreur de connexion au serveur",
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString()
      }]);
    } finally {
      setIsTyping(false);
    }
  };
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
  
        
        <div >
          <div className="flex-1 overflow-y-auto mb-4 rounded-xl bg-gray-300 p-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`mb-4 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}
              >
                <div
  className={`inline-block px-4 py-2 rounded-lg max-w-xs lg:max-w-md ${
    msg.sender === 'user'
      ? 'bg-red-700 text-white'
      : 'bg-gray-700 text-white'
  }`}
>
                  {msg.text}
                  {msg.image && (
                    <img 
                      src={msg.image} 
                      alt="Réponse" 
                      className="mt-2 rounded-lg max-w-full"
                    />
                  )}
                  <div className="text-xs opacity-70 mt-1">
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="text-left">
                <div className="inline-block px-4 py-2 rounded-lg bg-gray-700 text-white">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Posez votre question..."
              className="flex-1 p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#4CAF50]"
            />
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim()}
              className="p-3 bg-[#4CAF50] text-white rounded-lg hover:bg-[#45a049] disabled:bg-gray-400"
            >
              Envoyer
            </button>
          </div>
        </div>
      
  );
};

export default ChatbotPage;