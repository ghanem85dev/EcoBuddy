import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const AcceptInvite = () => {
  const { token } = useParams();
  const [message, setMessage] = useState("");

  useEffect(() => {
    axios.get(`/api/accept-invite/${token}`)
      .then(() => setMessage("Invitation acceptée avec succès !"))
      .catch(() => setMessage("Erreur lors de l'acceptation de l'invitation."));
  }, [token]);

  return <h2>{message}</h2>;
};

export default AcceptInvite;