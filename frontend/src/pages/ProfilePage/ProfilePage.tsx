import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Profile } from '../../components/ProfilePage/Profile';
import type { UserProfile } from '../../types/user'; // Добавлен type
import styles from './ProfilePage.module.css';

const initialUser: UserProfile = {
  id: '1',
  username: 'booklover42',
  email: 'booklover@example.com',
  fullName: 'Александр Иванов',
  bio: 'Любитель классической литературы и современной фантастики. Собираю свою цифровую библиотеку уже 3 года.',
  avatarUrl: 'https://via.placeholder.com/150',
  phone: '+7 (999) 123-45-67',
  location: 'Москва, Россия',
  joinDate: '15 января 2023',
  stats: {
    booksAdded: 47,
    booksRead: 23,
    favoriteGenre: 'Фантастика'
  }
};

export const ProfilePage: React.FC = observer(() => {
  const [user, setUser] = useState<UserProfile>(initialUser);

  const handleSaveProfile = (updatedUser: UserProfile) => {
    // В реальном приложении здесь будет API запрос
    console.log('Сохранение профиля:', updatedUser);
    setUser(updatedUser);
    // Можно добавить уведомление об успешном сохранении
  };

  const handleCancelEdit = () => {
    console.log('Редактирование отменено');
    // Можно добавить сброс изменений
  };

  return (
    <div className={styles.wrapper}>
      <Profile
        user={user}
        onSave={handleSaveProfile}
        onCancel={handleCancelEdit}
      />
    </div>
  );
});