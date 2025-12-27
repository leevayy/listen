import React, { useState, useEffect } from 'react';
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
  Xmark,
  ArrowRightFromSquare,
  ArrowRightToSquare,
  Lock,
  LockOpen
} from '@gravity-ui/icons';
import { logout } from '../../api/fetchers'; // Импортируем функцию логаута
import type { UserProfile } from '../../types/user';
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false); // Добавляем состояние для логаута
  const [editedUser, setEditedUser] = useState<UserProfile>({ ...user });

  // Проверяем авторизацию при загрузке компонента
  useEffect(() => {
    const sessionId = localStorage.getItem('sessionId');
    setIsAuthenticated(!!sessionId);
  }, []);

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

  // Функция для входа/выхода с использованием API
  const handleAuthAction = async () => {
    if (isAuthenticated) {
      // Выход из аккаунта
      setIsLoggingOut(true);
      
      try {
        // Вызываем API для логаута
        await logout();
        console.log('Вы успешно вышли из аккаунта');
        
        // Обновляем состояние
        setIsAuthenticated(false);
        
        // Перенаправляем на страницу авторизации
        window.location.href = '/auth';
        
      } catch (error) {
        console.error('Ошибка при выходе из аккаунта:', error);
        
        // Даже если ошибка, очищаем данные на клиенте
        localStorage.removeItem('sessionId');
        localStorage.removeItem('userData');
        localStorage.removeItem('redirectPath');
        setIsAuthenticated(false);
        
        // И все равно перенаправляем
        window.location.href = '/auth';
      } finally {
        setIsLoggingOut(false);
      }
    } else {
      // Вход в аккаунт
      window.location.href = '/auth';
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
      {/* Заголовок и кнопки */}
      <Flex justifyContent="space-between" alignItems="center">
        <Text variant="header-1">Профиль пользователя</Text>
        
        <Flex gap="2">
          {/* Кнопка Войти/Выйти */}
          <Button
            view={isAuthenticated ? "outlined-danger" : "outlined-action"}
            size="l"
            onClick={handleAuthAction}
            loading={isLoggingOut} // Показываем загрузку при выходе
            disabled={isLoggingOut} // Отключаем кнопку во время выхода
          >
            {isAuthenticated ? (
              <>
                <ArrowRightToSquare />
                Выйти
              </>
            ) : (
              <>
                <ArrowRightFromSquare />
                Войти в аккаунт
              </>
            )}
          </Button>
          
          {/* Кнопка редактирования (только для авторизованных) */}
          {isAuthenticated && !isEditing ? (
            <Button
              view="outlined"
              size="l"
              onClick={() => setIsEditing(true)}
              disabled={isLoggingOut}
            >
              <Pencil />
              Редактировать профиль
            </Button>
          ) : isAuthenticated && isEditing ? (
            <Flex gap="2">
              <Button
                view="action"
                size="l"
                onClick={handleSave}
                disabled={isLoggingOut}
              >
                <FloppyDisk />
                Сохранить
              </Button>
              <Button
                view="outlined"
                size="l"
                onClick={handleCancel}
                disabled={isLoggingOut}
              >
                <Xmark />
                Отмена
              </Button>
            </Flex>
          ) : null}
        </Flex>
      </Flex>

      {/* Сообщение о выходе */}
      {isLoggingOut && (
        <div style={{ padding: '8px 16px' }}>
          <Text variant="body-2" color="secondary">
            Выход из системы...
          </Text>
        </div>
      )}

      {/* Остальной код остается без изменений */}
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
                {isEditing && isAuthenticated ? (
                  <TextInput
                    label="Имя пользователя"
                    value={editedUser.username}
                    onChange={(e) => handleChange('username', e.target.value)}
                    size="l"
                    disabled={isLoggingOut}
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
              {isEditing && isAuthenticated ? (
                <TextInput
                  value={editedUser.fullName}
                  onChange={(e) => handleChange('fullName', e.target.value)}
                  placeholder="Введите полное имя"
                  size="m"
                  disabled={isLoggingOut}
                />
              ) : (
                <Text variant="body-2">{user.fullName}</Text>
              )}
            </Flex>

            {/* О себе */}
            <Flex direction="column" gap="1">
              <Text variant="subheader-1">О себе</Text>
              {isEditing && isAuthenticated ? (
                <TextArea
                  value={editedUser.bio}
                  onChange={(e) => handleChange('bio', e.target.value)}
                  placeholder="Расскажите о себе..."
                  minRows={3}
                  maxRows={6}
                  disabled={isLoggingOut}
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
                  {isEditing && isAuthenticated ? (
                    <TextInput
                      value={editedUser.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="email@example.com"
                      size="s"
                      className={styles.contactInput}
                      disabled={isLoggingOut}
                    />
                  ) : (
                    <Text variant="body-2">{user.email}</Text>
                  )}
                </Flex>

                {/* Телефон */}
                <Flex alignItems="center" gap="2">
                  <span></span>
                  <Text variant="body-1" className={styles.contactLabel}>Телефон:</Text>
                  {isEditing && isAuthenticated ? (
                    <TextInput
                      value={editedUser.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      placeholder="+7 (XXX) XXX-XX-XX"
                      size="s"
                      className={styles.contactInput}
                      disabled={isLoggingOut}
                    />
                  ) : (
                    <Text variant="body-2">{user.phone}</Text>
                  )}
                </Flex>

                {/* Местоположение */}
                <Flex alignItems="center" gap="2">
                  <span></span>
                  <Text variant="body-1" className={styles.contactLabel}>Местоположение:</Text>
                  {isEditing && isAuthenticated ? (
                    <TextInput
                      value={editedUser.location}
                      onChange={(e) => handleChange('location', e.target.value)}
                      placeholder="Город, страна"
                      size="s"
                      className={styles.contactInput}
                      disabled={isLoggingOut}
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
                {isEditing && isAuthenticated && (
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
                    disabled={isLoggingOut}
                  />
                )}
              </Card>
              
              {/* Статус авторизации */}
              <Card className={styles.statItem}>
                <Text variant="display-2" className={styles.statNumber}>
                  {isAuthenticated ? <Lock /> : <LockOpen />}
                </Text>
                <Text variant="body-2" color="secondary">
                  {isAuthenticated ? 'Авторизован' : 'Не авторизован'}
                </Text>
              </Card>
            </Flex>
          </Card>

          {/* Быстрые действия */}
          <Card className={styles.actionsCard}>
            <Text variant="header-2">Быстрые действия</Text>
            
            <Flex direction="column" gap="2">
              <Button 
                view="outlined" 
                size="l" 
                width="max"
                disabled={!isAuthenticated || isLoggingOut}
                title={!isAuthenticated ? "Требуется авторизация" : ""}
              >
                Моя коллекция
              </Button>
              <Button 
                view="outlined" 
                size="l" 
                width="max"
                disabled={!isAuthenticated || isLoggingOut}
                title={!isAuthenticated ? "Требуется авторизация" : ""}
              >
                Закладки
              </Button>
              <Button 
                view="outlined" 
                size="l" 
                width="max"
                disabled={!isAuthenticated || isLoggingOut}
                title={!isAuthenticated ? "Требуется авторизация" : ""}
              >
                Избранное
              </Button>
              <Button 
                view="outlined" 
                size="l" 
                width="max"
                disabled={!isAuthenticated || isLoggingOut}
                title={!isAuthenticated ? "Требуется авторизация" : ""}
              >
                История чтения
              </Button>
            </Flex>
          </Card>

          {/* Настройки */}
          <Card className={styles.settingsCard}>
            <Text variant="header-2">Настройки</Text>
            
            <Flex direction="column" gap="2">
              <Button 
                view="outlined" 
                size="m" 
                width="max"
                disabled={!isAuthenticated || isLoggingOut}
                title={!isAuthenticated ? "Требуется авторизация" : ""}
              >
                Изменить пароль
              </Button>
              <Button 
                view="outlined" 
                size="m" 
                width="max"
                disabled={!isAuthenticated || isLoggingOut}
                title={!isAuthenticated ? "Требуется авторизация" : ""}
              >
                Настройки уведомлений
              </Button>
              <Button 
                view="outlined" 
                size="m" 
                width="max"
                disabled={!isAuthenticated || isLoggingOut}
                title={!isAuthenticated ? "Требуется авторизация" : ""}
              >
                Приватность
              </Button>
              <Button 
                view="outlined-danger" 
                size="m" 
                width="max"
                disabled={!isAuthenticated || isLoggingOut}
                title={!isAuthenticated ? "Требуется авторизация" : ""}
              >
                Удалить аккаунт
              </Button>
            </Flex>
          </Card>
        </Flex>
      </Flex>
    </Flex>
  );
};