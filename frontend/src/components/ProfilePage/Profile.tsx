import React, { useState } from 'react';
import {
  Button,
  Flex,
  Text,
  Card,
  TextInput,
  Avatar,
  TextArea,
  Select
} from '@gravity-ui/uikit';
import { 
  Envelope, 
  Pencil, 
  FloppyDisk,
  Xmark 
} from '@gravity-ui/icons';
import type { UserProfile } from '../../types/user'; // Добавлен type
import styles from './Profile.module.css';

type ProfileProps = {
  user: UserProfile;
  onSave?: (updatedUser: UserProfile) => void;
  onCancel?: () => void;
};

export const Profile: React.FC<ProfileProps> = ({
  user,
  onSave,
  onCancel
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState<UserProfile>({ ...user });

  const handleSave = () => {
    if (onSave) {
      onSave(editedUser);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedUser({ ...user });
    setIsEditing(false);
    if (onCancel) {
      onCancel();
    }
  };

  const handleChange = (field: keyof UserProfile, value: string) => {
    setEditedUser(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleStatsChange = (field: keyof UserProfile['stats'], value: string) => {
    setEditedUser(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        [field]: value
      }
    }));
  };

  return (
    <Flex direction="column" gap="4" className={styles.profileContainer}>
      {/* Заголовок и кнопки редактирования */}
      <Flex justifyContent="space-between" alignItems="center">
        <Text variant="header-1">Профиль пользователя</Text>
        
        {!isEditing ? (
          <Button
            view="outlined"
            size="l"
            onClick={() => setIsEditing(true)}
          >
            <Pencil />
            Редактировать профиль
          </Button>
        ) : (
          <Flex gap="2">
            <Button
              view="action"
              size="l"
              onClick={handleSave}
            >
              <FloppyDisk />
              Сохранить
            </Button>
            <Button
              view="outlined"
              size="l"
              onClick={handleCancel}
            >
              <Xmark />
              Отмена
            </Button>
          </Flex>
        )}
      </Flex>

      <Flex gap="4" wrap className={styles.profileContent}>
        {/* Левая колонка - основная информация */}
        <Card className={styles.mainInfoCard}>
          <Flex direction="column" gap="4">
            {/* Аватар и имя */}
            <Flex alignItems="center" gap="3">
              <Avatar
                size="xl"
                imgUrl={user.avatarUrl}
                className={styles.avatar}
              />
              <Flex direction="column" gap="1">
                {isEditing ? (
                  <TextInput
                    label="Имя пользователя"
                    value={editedUser.username}
                    onChange={(e) => handleChange('username', e.target.value)}
                    size="l"
                  />
                ) : (
                  <Text variant="header-2">{user.username}</Text>
                )}
                <Text variant="caption-1" color="secondary">
                  Участник с {user.joinDate}
                </Text>
              </Flex>
            </Flex>

            {/* Полное имя */}
            <Flex direction="column" gap="1">
              <Text variant="subheader-1">
                Полное имя
              </Text>
              {isEditing ? (
                <TextInput
                  value={editedUser.fullName}
                  onChange={(e) => handleChange('fullName', e.target.value)}
                  placeholder="Введите полное имя"
                  size="m"
                />
              ) : (
                <Text variant="body-2">{user.fullName}</Text>
              )}
            </Flex>

            {/* О себе */}
            <Flex direction="column" gap="1">
              <Text variant="subheader-1">О себе</Text>
              {isEditing ? (
                <TextArea
                  value={editedUser.bio}
                  onChange={(e) => handleChange('bio', e.target.value)}
                  placeholder="Расскажите о себе..."
                  minRows={3}
                  maxRows={6}
                />
              ) : (
                <Text variant="body-2">{user.bio}</Text>
              )}
            </Flex>

            {/* Контактная информация */}
            <Card className={styles.contactsCard}>
              <Text variant="header-2" className={styles.contactsTitle}>
                Контактная информация
              </Text>
              
              <Flex direction="column" gap="2">
                {/* Email */}
                <Flex alignItems="center" gap="2">
                  <Envelope />
                  <Text variant="body-1" className={styles.contactLabel}>Email:</Text>
                  {isEditing ? (
                    <TextInput
                      value={editedUser.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="email@example.com"
                      size="s"
                      className={styles.contactInput}
                    />
                  ) : (
                    <Text variant="body-2">{user.email}</Text>
                  )}
                </Flex>

                {/* Телефон */}
                <Flex alignItems="center" gap="2">
                  <span></span>
                  <Text variant="body-1" className={styles.contactLabel}>Телефон:</Text>
                  {isEditing ? (
                    <TextInput
                      value={editedUser.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      placeholder="+7 (XXX) XXX-XX-XX"
                      size="s"
                      className={styles.contactInput}
                    />
                  ) : (
                    <Text variant="body-2">{user.phone}</Text>
                  )}
                </Flex>

                {/* Местоположение */}
                <Flex alignItems="center" gap="2">
                  <span></span>
                  <Text variant="body-1" className={styles.contactLabel}>Местоположение:</Text>
                  {isEditing ? (
                    <TextInput
                      value={editedUser.location}
                      onChange={(e) => handleChange('location', e.target.value)}
                      placeholder="Город, страна"
                      size="s"
                      className={styles.contactInput}
                    />
                  ) : (
                    <Text variant="body-2">{user.location}</Text>
                  )}
                </Flex>
              </Flex>
            </Card>
          </Flex>
        </Card>

        {/* Правая колонка - статистика */}
        <Flex direction="column" gap="4" className={styles.statsColumn}>
          {/* Статистика */}
          <Card className={styles.statsCard}>
            <Text variant="header-2">Статистика</Text>
            
            <Flex direction="column" gap="3" className={styles.statsGrid}>
              <Card className={styles.statItem}>
                <Text variant="display-2" className={styles.statNumber}>
                  {user.stats.booksAdded}
                </Text>
                <Text variant="body-2" color="secondary">
                  Книг добавлено
                </Text>
              </Card>

              <Card className={styles.statItem}>
                <Text variant="display-2" className={styles.statNumber}>
                  {user.stats.booksRead}
                </Text>
                <Text variant="body-2" color="secondary">
                  Книг прочитано
                </Text>
              </Card>

              <Card className={styles.statItem}>
                <Text variant="display-2" className={styles.statNumber}>
                  {user.stats.favoriteGenre}
                </Text>
                <Text variant="body-2" color="secondary">
                  Любимый жанр
                </Text>
                {isEditing && (
                  <Select
                    value={[editedUser.stats.favoriteGenre]}
                    onUpdate={(value: string[]) => handleStatsChange('favoriteGenre', value[0])}
                    options={[
                      { value: 'Фантастика', content: 'Фантастика' },
                      { value: 'Детектив', content: 'Детектив' },
                      { value: 'Роман', content: 'Роман' },
                      { value: 'Научная литература', content: 'Научная литература' },
                      { value: 'Поэзия', content: 'Поэзия' },
                      { value: 'Биография', content: 'Биография' }
                    ]}
                    size="s"
                    className={styles.genreSelect}
                  />
                )}
              </Card>
            </Flex>
          </Card>

          {/* Быстрые действия */}
          <Card className={styles.actionsCard}>
            <Text variant="header-2">Быстрые действия</Text>
            
            <Flex direction="column" gap="2">
              <Button view="outlined" size="l" width="max">
                Моя коллекция
              </Button>
              <Button view="outlined" size="l" width="max">
                Закладки
              </Button>
              <Button view="outlined" size="l" width="max">
                Избранное
              </Button>
              <Button view="outlined" size="l" width="max">
                История чтения
              </Button>
            </Flex>
          </Card>

          {/* Настройки */}
          <Card className={styles.settingsCard}>
            <Text variant="header-2">Настройки</Text>
            
            <Flex direction="column" gap="2">
              <Button view="outlined" size="m" width="max">
                Изменить пароль
              </Button>
              <Button view="outlined" size="m" width="max">
                Настройки уведомлений
              </Button>
              <Button view="outlined" size="m" width="max">
                Приватность
              </Button>
              <Button view="outlined-danger" size="m" width="max">
                Удалить аккаунт
              </Button>
            </Flex>
          </Card>
        </Flex>
      </Flex>
    </Flex>
  );
};