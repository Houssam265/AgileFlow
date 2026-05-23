import NotificationPreferences from '../../components/users/NotificationPreferences';

const ProfileNotificationsTab = () => (
  <NotificationPreferences
    title="Notifications par email"
    description="Choisissez les evenements pour lesquels AgileFlow vous envoie un email."
    embedded
  />
);

export default ProfileNotificationsTab;
