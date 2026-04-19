import React, { useEffect } from 'react';
import AppRouter from './routes/AppRouter';
import { useAuthStore } from './store/authStore';

const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 minutes en millisecondes

const App = () => {
  const logout = useAuthStore((state) => state.logout);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    // Si l'utilisateur n'est pas connecté, pas besoin de timer d'inactivité
    if (!token) return;

    let timeoutId: number;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        // Déconnexion et redirection forcée au bout des 15 mins
        logout();
        window.location.href = '/login';
      }, INACTIVITY_LIMIT);
    };

    // Événements d'interaction à surveiller
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach((evt) => window.addEventListener(evt, resetTimer));

    resetTimer(); // Initie le timer lors du chargement

    return () => {
      clearTimeout(timeoutId);
      events.forEach((evt) => window.removeEventListener(evt, resetTimer));
    };
  }, [logout, token]);

  return <AppRouter />;
};

export default App;