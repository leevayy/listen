import { useEffect } from 'react';
import { AuthForm } from "../../components/AuthForm/AuthForm";

export const AuthPage: React.FC = () => {
  useEffect(() => {
    // Проверяем, пришли ли мы с кнопки "Выйти"
    const urlParams = new URLSearchParams(window.location.search);
    const isLogout = urlParams.get('logout') === 'true';
    
    if (isLogout) {
      // Очищаем все данные аутентификации
      localStorage.removeItem('sessionId');
      localStorage.removeItem('userData');
      console.log('Выполнен принудительный выход из системы');
      
      // Убираем параметр из URL чтобы избежать бесконечной перезагрузки
      window.history.replaceState({}, '', '/auth');
    }
  }, []);

  return <AuthForm />;
};