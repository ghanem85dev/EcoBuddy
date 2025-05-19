import { useContext, useState, useEffect, useRef } from "react";
import RealTimeConsumption from "../../commun/components/RealTimeConsumption";
import ComparisonRange from "../../commun/components/ComparisonRange";
import ConsumptionComparisonByCategory from "../../commun/components/ConsumptionComparisonByCategory";
import TopSitesDoughnutChart from "../../commun/components/ConsommationCategorie";
import { useNavigate } from "react-router-dom";
import MonthlyConsumptionIndicator from "../../commun/components/MonthlyConsumptionIndicator";
import ExtremeConsumptionCard from "../../commun/components/ExtremeConsumptionCard";
import StatsCard from "../../commun/components/StatsCard";
import { FaComment,FaTimes } from "react-icons/fa";
import { AuthContext } from "../../commun/context/AuthContext";
import GamificationCard from "../../commun/components/GamificationCard";
import axios from "axios";
import { useTheme } from "../../commun/context/ThemeContext";

const ChatbotModal = ({ userId, onClose, theme }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const RASA_API_URL = 'http://localhost:8000/api/chatbot';
  const FASTAPI_URL = 'http://localhost:8000/conversations/';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!userId) return;
    
    const fetchConversationHistory = async () => {
      try {
        const response = await axios.get(`${FASTAPI_URL}${userId}`);
        setMessages(response.data.map(msg => ({
          text: msg.message,
          sender: msg.sender_type,
          timestamp: new Date(msg.timestamp).toLocaleTimeString(),
          image: msg.image || null
        })));
      } catch (error) {
        console.error("Erreur historique:", error);
      }
    };

    fetchConversationHistory();
  }, [userId]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || !userId) return;

    const userMessage = {
      text: inputMessage,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      await axios.post(FASTAPI_URL, {
        sender_id: String(userId),
        message: inputMessage,
        sender_type: 'user',
        timestamp: new Date().toISOString(),
      });

      const rasaResponse = await axios.post(RASA_API_URL, {
        sender: userId,
        message: inputMessage,
      });

      if (rasaResponse.data?.length > 0) {
        for (const resp of rasaResponse.data) {
          const botMessage = {
            sender_id: String(userId),
            message: resp.text,
            sender_type: 'bot',
            timestamp: new Date().toISOString(),
            image: resp.image || null
          };
          
          await axios.post(FASTAPI_URL, botMessage);
          
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
    <div className={`fixed bottom-24 right-8 w-[32rem] h-[36rem] flex flex-col rounded-lg shadow-xl z-50 ${
      theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
    }`}>
      <div className={`flex justify-between items-center p-4 border-b ${
        theme === 'dark' ? 'border-gray-700 bg-gray-900' : 'border-gray-300 bg-gray-100'
      } rounded-t-lg`}>
        <h3 className="font-semibold text-lg">EnergyChat</h3>
        <button 
          onClick={onClose} 
          className={`p-1 rounded-full ${
            theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
          }`}
        >
          <FaTimes className="text-lg" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((msg, index) => (
          <div key={index} className={`mb-3 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
            <div className={`inline-block px-4 py-2 rounded-lg max-w-xs lg:max-w-md ${
              msg.sender === 'user'
                ? theme === 'dark' ? 'bg-[#2DBDAC] text-white' : 'bg-[#2DBDAC] text-white'
                : theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800'
            }`}>
              {msg.text}
              {msg.image && (
                <img 
                  src={msg.image} 
                  alt="Réponse" 
                  className="mt-2 rounded-lg max-w-full"
                />
              )}
              <div className={`text-xs mt-1 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {msg.timestamp}
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="text-left">
            <div className={`inline-block px-4 py-2 rounded-lg ${
              theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800'
            }`}>
              <div className="flex space-x-1">
                <div className={`w-2 h-2 rounded-full ${
                  theme === 'dark' ? 'bg-gray-400' : 'bg-gray-500'
                } animate-bounce`}></div>
                <div className={`w-2 h-2 rounded-full ${
                  theme === 'dark' ? 'bg-gray-400' : 'bg-gray-500'
                } animate-bounce`} style={{ animationDelay: '0.2s' }}></div>
                <div className={`w-2 h-2 rounded-full ${
                  theme === 'dark' ? 'bg-gray-400' : 'bg-gray-500'
                } animate-bounce`} style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className={`p-4 border-t ${
        theme === 'dark' ? 'border-gray-700' : 'border-gray-300'
      }`}>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Posez votre question..."
            className={`flex-1 p-3 rounded-lg border ${
              theme === 'dark' 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-800'
            } focus:outline-none focus:ring-2 focus:ring-[#2DBDAC]`}
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim()}
            className={`p-3 rounded-lg ${
              theme === 'dark'
                ? 'bg-[#2DBDAC] hover:bg-[#239a8c] text-white'
                : 'bg-[#2DBDAC] hover:bg-[#239a8c] text-white'
            } disabled:bg-gray-400 disabled:cursor-not-allowed`}
          >
            Envoyer
          </button>
        </div>
      </div>
    </div>
  );
};

const DashboardPage = () => {
  const { idUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [showChatbot, setShowChatbot] = useState(false);
const { theme } = useTheme();
  useEffect(() => {
    if (idUser) {
      setLoading(false);
    }
  }, [idUser]);
  const toggleChatbot = () => {
    setShowChatbot(!showChatbot);
  };
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Chargement...</div>;
  }

  return (
    
    <>
    <div className="space-y-6">
        <div className="flex" style={{ gap: '32px' }}>
          <StatsCard idUser={idUser} type="site" />
          <StatsCard idUser={idUser} type="appareil" />
          <StatsCard idUser={idUser} type="appareil" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ConsumptionComparisonByCategory idUser={idUser} />
          </div>
          
          <div className="lg:col-span-2">
            <RealTimeConsumption idUser={idUser} /> 
          </div>
          
          <div className="lg:col-span-2">
            <ComparisonRange userId={idUser} />
           
          </div>
          
          <div className="lg:col-span-1 relative top-[-1362px]">
            <div className="lg:col-span-2 mb-6">
                    <GamificationCard userId={idUser} />
                    </div>
          <div className="lg:col-span-2 mb-6"> {/* Ajout de mb-6 pour la marge basse */}
          <MonthlyConsumptionIndicator idUser={idUser} />
          </div>
          <div className="lg:col-span-2 mb-6">
          <ExtremeConsumptionCard type="appareil" userId={idUser} />
          </div>
          <div className="lg:col-span-2 mb-6">
          <ExtremeConsumptionCard type="site" userId={idUser} />
          </div>
          <div className="lg:col-span-2">
          <TopSitesDoughnutChart userId={idUser} type="residence"/>
          </div>
          </div>
      </div>

        <button 
                onClick={toggleChatbot}
                className={`fixed bottom-8 right-8 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-colors ${
                  theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
                } text-white z-40`}
                aria-label="Ouvrir le chatbot"
              >
                <FaComment className="text-xl" />
              </button>
              
              {showChatbot && (
                <ChatbotModal 
                  userId={idUser} 
                  onClose={() => setShowChatbot(false)} 
                  theme={theme} 
                />
              )}
      </div>
    </>
    
  );
};

export default DashboardPage;