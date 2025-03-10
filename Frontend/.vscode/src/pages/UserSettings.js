import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Sidebar } from "../layouts/SideBar";
import { Header } from "../layouts/header";
import profileImg from "../assets/profile.png";

const UserSettings = () => {
    const { idUser } = useParams();
    console.log('ID Utilisateur récupéré depuis l\'URL:', idUser);

    const [userSettings, setUserSettings] = useState({
        budget_max: 0,
        email: '',
        role: '',
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!idUser) {
            setError("ID utilisateur non disponible.");
            setLoading(false);
            return;
        }

        axios.get(`http://localhost:8000/user/${idUser}/settings`)
            .then((response) => {
                setUserSettings(response.data);
                setLoading(false);
            })
            .catch(() => {
                setError('Erreur lors de la récupération des données utilisateur');
                setLoading(false);
            });
    }, [idUser]);

    const handleSubmit = (event) => {
        event.preventDefault();
        axios.put(`http://localhost:8000/user/${idUser}/settings`, userSettings)
            .then(() => {
                alert('Paramètres mis à jour avec succès !');
            })
            .catch(() => {
                alert('Erreur lors de la mise à jour des paramètres');
            });
    };

    const handleChange = (event) => {
        const { name, value } = event.target;
        setUserSettings((prevSettings) => ({
            ...prevSettings,
            [name]: value,
        }));
    };

    if (loading) return <div className="text-blue-400 font-semibold">Chargement...</div>;
    if (error) return <div className="text-red-500 font-semibold">{error}</div>;

    return (
        <div className="min-h-screen bg-[#0F172A] transition-colors">
        <Sidebar />
        <div className="md:ml-[240px]"> 
          <Header idUser={idUser}/>
          <div className="h-[calc(100vh-60px)] overflow-y-auto p-6"> 
                    <div className="grid grid-cols-1 md:grid-cols-2 w-full max-w-5xl bg-[#1a2e45] rounded-2xl shadow-lg overflow-hidden">
                        {/* Illustration */}
                        <div className="hidden md:flex items-center justify-center bg-blue-500 p-10">
                            <img src={profileImg} alt="Profile Illustration" className="w-3/4" />
                        </div>
                        {/* Formulaire */}
                        <div className="p-10 w-full">
                            <h2 className="text-3xl font-semibold text-blue-300 mb-6">Paramètres de l'utilisateur</h2>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="flex flex-col">
                                    <label htmlFor="email" className="text-blue-200 text-lg">Email</label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={userSettings.email}
                                        onChange={handleChange}
                                        required
                                        className="bg-[#0F172A] text-white p-4 rounded-md border border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <label htmlFor="budget_max" className="text-blue-200 text-lg">Budget maximum</label>
                                    <input
                                        type="number"
                                        id="budget_max"
                                        name="budget_max"
                                        value={userSettings.budget_max}
                                        onChange={handleChange}
                                        required
                                        className="bg-[#0F172A] text-white p-4 rounded-md border border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                    />
                                </div>
                                <button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white py-4 rounded-lg text-lg font-semibold transition">Mettre à jour</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserSettings;
