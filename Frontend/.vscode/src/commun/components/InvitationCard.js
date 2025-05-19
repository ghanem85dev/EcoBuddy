import React from "react";
import { motion } from "framer-motion";
import { FiClock, FiCheck, FiX, FiCalendar, FiUser, FiMail, FiArrowRight } from "react-icons/fi";

const InvitationCard = ({ invitation, variant = "received" }) => {
  const statusConfig = {
    pending: {
      color: "bg-[#17B3DE]",
      textColor: "text-white",
      icon: <FiClock className="text-white" />,
      text: "En attente"
    },
    accepted: {
      color: "bg-[#2DBDAC]",
      textColor: "text-white",
      icon: <FiCheck className="text-white" />,
      text: "Acceptée"
    },
    rejected: {
      color: "bg-[#F36D8F]",
      textColor: "text-white",
      icon: <FiX className="text-white" />,
      text: "Refusée"
    },
    default: {
      color: "bg-gray-400",
      textColor: "text-white",
      icon: <FiX className="text-white" />,
      text: "Inconnu"
    }
  };

  const status = invitation.status?.toLowerCase() || "default";
  const { color, textColor, icon, text } = statusConfig[status] || statusConfig.default;

  const displayEmail = variant === "received" 
    ? invitation.sender_email 
    : invitation.recipient_email;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
      transition={{ duration: 0.3 }}
      className={`bg-white rounded-xl shadow-md overflow-hidden border-l-4 ${
        variant === "received" ? "border-[#17B3DE]" : "border-[#2DBDAC]"
      } hover:shadow-lg transition-all duration-300 cursor-pointer`}
    >
      <div className="p-5">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {invitation.site_name || "Site inconnu"}
            </h3>
            
            {variant === "received" && invitation.owner_email && (
              <p className="text-sm text-gray-500 mt-1 flex items-center">
                <FiUser className="mr-1 text-[#17B3DE]" />
                {invitation.owner_email}
              </p>
            )}
            
            {variant === "sent" && invitation.email && (
              <p className="text-sm text-gray-500 mt-1 flex items-center">
                <FiUser className="mr-1 text-[#2DBDAC]" />
                {invitation.email}
              </p>
            )}
          </div>
          
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className={`${color} ${textColor} text-xs px-3 py-1 rounded-full flex items-center gap-1 font-medium`}
          >
            {icon}
            <span>{text}</span>
          </motion.div>
        </div>

        {displayEmail && (
          <motion.p 
            whileHover={{ x: 3 }}
            className="mt-3 text-gray-600 flex items-center gap-2"
          >
            <FiArrowRight className="text-[#F36D8F]" />
            {displayEmail}
          </motion.p>
        )}

        {invitation.message && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 p-3 bg-gray-50 rounded-lg border-l-2 border-[#2DBDAC]"
          >
            <p className="text-sm text-gray-600 italic">"{invitation.message}"</p>
          </motion.div>
        )}

        <div className="mt-5 pt-4 border-t border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-2 text-gray-500">
            <FiCalendar className={variant === "received" ? "text-[#17B3DE]" : "text-[#2DBDAC]"} />
            <span className="text-sm">
              {invitation.created_at ? new Date(invitation.created_at).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }) : "Date inconnue"}
            </span>
          </div>

         
        </div>
      </div>
    </motion.div>
  );
};

export default InvitationCard;