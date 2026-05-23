import { Navigate } from 'react-router-dom';

/** @deprecated Utiliser /profile/notifications */
const SettingsPage = () => <Navigate to="/profile/notifications" replace />;

export default SettingsPage;
