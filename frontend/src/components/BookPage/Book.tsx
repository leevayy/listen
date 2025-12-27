import React, { useState, useEffect, useRef } from 'react';
import { 
  Button, 
  Flex, 
  Text, 
  Progress,
  Select,
  Loader,
  Alert,
  Icon,
  Modal
} from '@gravity-ui/uikit';
import styles from './Book.module.css';
import { 
  getCurrentPageInfo, 
  getPageText, 
  getPageAudio,
  saveFinishedPage 
} from '../../api/fetchers';
import { Play, Pause, Stop, ArrowLeft, ArrowRight, Flag } from '@gravity-ui/icons';

type BookProps = {
  bookId?: string;
  bookTitle: string;
  bookAuthor: string;
  bookFile?: File | null;
  bookFileUrl?: string;
  isDemo?: boolean;
};

export const Book: React.FC<BookProps> = ({
  bookId,
  bookTitle,
  bookAuthor,
  bookFile,
  bookFileUrl,
  isDemo = false
}) => {
  // Состояния
  const [pageInfo, setPageInfo] = useState<{
    pageId: number;
    previousPageId?: number;
    nextPageId?: number;
  } | null>(null);
  const [pageText, setPageText] = useState('');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [isSavingProgress, setIsSavingProgress] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(100);
  const [currentAudioPageId, setCurrentAudioPageId] = useState<number | null>(null);
  const [isLastPage, setIsLastPage] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  
  // Рефы
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<number | null>(null);
  const hasInitialized = useRef(false);

  // Определяем ID демо-книг
  const demoBookIds = ['demo_1', 'demo_2', 'demo_3', 'demo_4', 'demo_5', 'demo_6'];
  const isDemoBook = bookId && (isDemo || demoBookIds.includes(bookId));

  // Настройка обработчиков событий аудио
  const setupAudioEventListeners = () => {
    if (!audioRef.current) return;
    
    console.log('Настройка обработчиков событий аудио');
    
    // Удаляем старые обработчики если есть
    audioRef.current.onplay = null;
    audioRef.current.onpause = null;
    audioRef.current.onended = null;
    audioRef.current.onerror = null;
    
    // Устанавливаем новые обработчики
    audioRef.current.onplay = () => {
      console.log('Аудио началось воспроизведение');
      setIsPlaying(true);
    };
    
    audioRef.current.onpause = () => {
      console.log('Аудио поставлено на паузу');
      setIsPlaying(false);
    };
    
    audioRef.current.onended = () => {
      console.log('Аудио завершилось');
      setIsPlaying(false);
      
      // Автопереход на следующую страницу
      if (bookId && currentAudioPageId !== null && !isDemoBook) {
        console.log('Автопереход на следующую страницу после аудио');
        saveProgressAndLoadNext(bookId, currentAudioPageId);
      }
    };
    
    audioRef.current.onerror = (e) => {
      console.error('Ошибка в audio элементе:', audioRef.current?.error);
      setError('Ошибка воспроизведения аудио');
      setIsPlaying(false);
    };
  };

  // Создаем и очищаем URL для аудио
  useEffect(() => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      
      // Устанавливаем src в audioRef если он есть
      if (audioRef.current) {
        audioRef.current.src = url;
        console.log('audioRef src обновлен с новым URL');
      }
      
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [audioBlob]);

  // Инициализация аудио элемента
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      setupAudioEventListeners();
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // ИНИЦИАЛИЗАЦИЯ КНИГИ
  const initializeBook = async () => {
    if (!bookId) return;
    
    console.log('Инициализация книги:', bookId, 'isDemoBook:', isDemoBook);
    
    if (isDemoBook) {
      // ДЕМО-КНИГИ: используем локальные данные
      initializeDemoBook();
    } else {
      // РЕАЛЬНЫЕ КНИГИ: загружаем с сервера
      await initializeRealBook();
    }
  };

  // Инициализация демо-книги
  const initializeDemoBook = () => {
    console.log('Инициализация демо-книги');
    
    // Начинаем всегда с первой страницы для демо-книг
    const firstPageInfo = {
      pageId: 1,
      previousPageId: undefined,
      nextPageId: 2
    };
    
    setPageInfo(firstPageInfo);
    setCurrentAudioPageId(1);
    setIsLastPage(false);
    
    setPageText(`Страница 1 демо-книги "${bookTitle}".
    
Это демонстрационный текст страницы 1. 
В реальной книге здесь был бы начало произведения.

Автор: ${bookAuthor || 'Неизвестен'}

Вы можете "листать" демо-книгу, нажимая кнопку "Следующая страница". 
Аудио-воспроизведение недоступно в демо-режиме.`);
    
    setIsLoading(false);
  };

  // Инициализация реальной книги (ИСПРАВЛЕНА)
  const initializeRealBook = async () => {
    console.log('Инициализация реальной книги');
    setIsLoading(true);
    setError(null);
    
    try {
      // Попробуем загрузить сохраненный прогресс
      console.log('Запрос сохраненного прогресса для книги:', bookId);
      const savedPageInfo = await getCurrentPageInfo(bookId!);
      console.log('Сохраненный прогресс:', savedPageInfo);
      
      if (savedPageInfo && savedPageInfo.pageId !== undefined) {
        // Есть сохраненный прогресс - продолжаем с него
        console.log('Продолжаем с сохраненного прогресса, страница:', savedPageInfo.pageId);
        setPageInfo(savedPageInfo);
        setCurrentAudioPageId(savedPageInfo.pageId);
        
        // Загружаем текст текущей страницы И АУДИО
        await loadPageTextAndAudio(bookId!, savedPageInfo.pageId);
        
        // Проверяем, последняя ли это страница
        if (savedPageInfo.nextPageId === undefined || savedPageInfo.nextPageId === null) {
          console.log('nextPageId отсутствует, проверяем вручную следующую страницу');
          try {
            const nextPageId = savedPageInfo.pageId + 1;
            const testText = await getPageText(bookId!, nextPageId);
            // Если дошли сюда, следующая страница существует
            console.log('Следующая страница', nextPageId, 'существует');
            const updatedInfo = {
              ...savedPageInfo,
              nextPageId: nextPageId
            };
            setPageInfo(updatedInfo);
            setIsLastPage(false);
          } catch (err: any) {
            if (err.status === 404) {
              console.log('Следующей страницы нет, это последняя страница');
              setIsLastPage(true);
            } else {
              console.log('Не удалось проверить следующую страницу, считаем текущую последней');
              setIsLastPage(true);
            }
          }
        } else {
          console.log('nextPageId есть:', savedPageInfo.nextPageId);
          setIsLastPage(false);
        }
      } else {
        // Нет сохраненного прогресса или сервер вернул null - начинаем с первой страницы
        console.log('Нет сохраненного прогресса, начинаем с первой страницы');
        await loadFirstRealPage();
      }
      
    } catch (err: any) {
      console.error('Ошибка инициализации реальной книги:', err);
      
      if (err.status === 404) {
        // Книга не найдена или нет прогресса - начинаем с первой страницы
        await loadFirstRealPage();
      } else {
        setError(`Ошибка загрузки книги: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Загрузка первой страницы реальной книги
  const loadFirstRealPage = async () => {
    console.log('Загрузка первой страницы реальной книги');
    
    try {
      // Пробуем разные варианты номеров первой страницы
      const pageNumbersToTry = [1, 0];
      
      for (const pageNum of pageNumbersToTry) {
        try {
          console.log(`Попытка загрузить страницу ${pageNum} как первую`);
          
          // Загружаем текст и аудио
          await loadPageTextAndAudio(bookId!, pageNum);
          
          const firstPageInfo = {
            pageId: pageNum,
            previousPageId: undefined,
            nextPageId: pageNum + 1
          };
          
          setPageInfo(firstPageInfo);
          setCurrentAudioPageId(pageNum);
          setIsLastPage(false);
          
          console.log(`Успешно загружена первая страница с номером ${pageNum}`);
          
          // Проверяем, есть ли вторая страница
          try {
            await getPageText(bookId!, pageNum + 1);
            console.log('Вторая страница существует, nextPageId установлен в', pageNum + 1);
          } catch (err: any) {
            if (err.status === 404) {
              console.log('Вторая страница не найдена, книга состоит из одной страницы');
              setIsLastPage(true);
              // Обновляем информацию о странице
              const updatedInfo = {
                ...firstPageInfo,
                nextPageId: undefined
              };
              setPageInfo(updatedInfo);
            }
          }
          
          return;
        } catch (err: any) {
          console.log(`Страница ${pageNum} не найдена, пробуем следующую`);
          continue;
        }
      }
      
      // Если ни одна страница не найдена
      throw new Error('Не удалось найти первую страницу книги');
      
    } catch (err: any) {
      console.error('Ошибка загрузки первой страницы:', err);
      
      // Создаем заглушку
      const firstPageInfo = {
        pageId: 1,
        previousPageId: undefined,
        nextPageId: undefined
      };
      
      setPageInfo(firstPageInfo);
      setCurrentAudioPageId(1);
      setPageText(`Начало книги "${bookTitle}".
      
Автор: ${bookAuthor || 'Неизвестен'}

Текст временно недоступен.`);
      setIsLastPage(true);
    }
  };

  // Загрузка текста и аудио страницы (только для реальных книг)
  const loadPageTextAndAudio = async (id: string, pageId: number) => {
    try {
      console.log('Загрузка текста для книги:', id, 'страница:', pageId);
      const textData = await getPageText(id, pageId);
      setPageText(textData.text || '');
      
      // ЗАГРУЖАЕМ АУДИО ВМЕСТЕ С ТЕКСТОМ
      console.log('Параллельная загрузка аудио для страницы:', pageId);
      try {
        const audioData = await getPageAudio(id, pageId);
        console.log('Аудио загружено вместе с текстом, размер:', audioData.size);
        setAudioBlob(audioData);
      } catch (audioErr: any) {
        console.warn('Аудио недоступно для этой страницы:', audioErr.message);
        setAudioBlob(null); // Сбрасываем аудио если его нет
      }
    } catch (err: any) {
      console.error('Ошибка загрузки текста:', err);
      
      if (err.status === 404) {
        setPageText(`Страница ${pageId} книги "${bookTitle}".
        
Текст временно недоступен.`);
      } else {
        setError(`Ошибка загрузки текста: ${err.message}`);
      }
    }
  };

  // Загрузка только текста страницы
  const loadPageText = async (id: string, pageId: number) => {
    try {
      console.log('Загрузка только текста для книги:', id, 'страница:', pageId);
      const textData = await getPageText(id, pageId);
      setPageText(textData.text || '');
    } catch (err: any) {
      console.error('Ошибка загрузки текста:', err);
      throw err;
    }
  };

  // Функция загрузки аудио страницы
  const loadPageAudio = async () => {
    if (!bookId || currentAudioPageId === null) {
      setError('Не указан ID книги или страницы');
      return null;
    }
    
    // Если демо-книга, не загружаем аудио
    if (isDemoBook) {
      setError('Аудио недоступно для демо-книг');
      return null;
    }
    
    setIsLoadingAudio(true);
    
    try {
      console.log('Загрузка аудио для книги:', bookId, 'страница:', currentAudioPageId);
      const audioData = await getPageAudio(bookId, currentAudioPageId);
      console.log('Получено аудио, размер:', audioData.size);
      setAudioBlob(audioData);
      return audioData;
    } catch (err: any) {
      console.error('Ошибка загрузки аудио:', err);
      
      if (err.status === 404) {
        setError(`Аудио для этой страницы недоступно`);
      } else {
        setError(`Ошибка загрузки аудио: ${err.message}`);
      }
      setAudioBlob(null);
      return null;
    } finally {
      setIsLoadingAudio(false);
    }
  };

  // ФУНКЦИЯ ПЕРЕХОДА НА СЛЕДУЮЩУЮ СТРАНИЦУ
  const saveProgressAndLoadNext = async (bookId: string, pageId: number) => {
    if (!bookId || pageId === null) {
      console.log('Недостаточно данных для перехода');
      return;
    }
    
    console.log('Переход на следующую страницу с текущей:', pageId);
    
    if (isDemoBook) {
      // ДЕМО-КНИГИ: локальная обработка
      handleDemoNextPage();
    } else {
      // РЕАЛЬНЫЕ КНИГИ: сохраняем прогресс и загружаем следующую страницу
      await handleRealNextPage(bookId, pageId);
    }
  };

  // Обработка следующей страницы для демо-книг
  const handleDemoNextPage = () => {
    console.log('Демо-книга, обрабатываем переход локально');
    
    if (!pageInfo) return;
    
    const currentPageId = pageInfo.pageId;
    const nextPageId = currentPageId + 1;
    
    // Для демо-книг всего 10 страниц
    if (nextPageId <= 10) {
      const newInfo = {
        pageId: nextPageId,
        previousPageId: nextPageId - 1,
        nextPageId: nextPageId < 10 ? nextPageId + 1 : undefined
      };
      
      setPageInfo(newInfo);
      setCurrentAudioPageId(nextPageId);
      
      setPageText(`Страница ${nextPageId} демо-книги "${bookTitle}".
      
Это демонстрационный текст страницы ${nextPageId}. 
      
Автор: ${bookAuthor || 'Неизвестен'}
      
${nextPageId < 10 ? 'Нажмите "Следующая страница" для продолжения.' : 'Это последняя страница демо-версии.'}`);
      
      // Проверяем последнюю страницу
      if (nextPageId >= 10) {
        setIsLastPage(true);
      } else {
        setIsLastPage(false);
      }
    } else {
      // Это была последняя страница
      setIsLastPage(true);
      setShowCompletionModal(true);
    }
  };

  // Обработка следующей страницы для реальных книг
  const handleRealNextPage = async (bookId: string, pageId: number) => {
    console.log('handleRealNextPage: книга', bookId, 'текущая страница', pageId);
    setIsSavingProgress(true);
    setError(null);
    
    try {
      // Сохраняем прогресс текущей страницы
      console.log('Сохранение прогресса страницы:', pageId);
      try {
        await saveFinishedPage(bookId, pageId);
        console.log('Прогресс сохранен');
      } catch (saveErr: any) {
        console.warn('Не удалось сохранить прогресс:', saveErr.message);
        // Продолжаем без сохранения
      }
      
      // Получаем информацию о следующей странице
      console.log('Получение информации о следующей странице для книги:', bookId);
      let nextPageInfo;
      try {
        nextPageInfo = await getCurrentPageInfo(bookId);
        console.log('Информация о следующей странице:', nextPageInfo);
      } catch (err: any) {
        console.log('getCurrentPageInfo вернул ошибку:', err.message);
        nextPageInfo = null;
      }
      
      // Определяем ID следующей страницы
      let nextPageIdToLoad: number;
      
      if (nextPageInfo && nextPageInfo.pageId !== undefined) {
        // Сервер вернул информацию о следующей странице
        nextPageIdToLoad = nextPageInfo.pageId;
        console.log('Используем страницу от сервера:', nextPageIdToLoad);
      } else {
        // Сервер не вернул информацию, пробуем следующую по порядку
        nextPageIdToLoad = pageId + 1;
        console.log('Сервер не вернул информацию, пробуем страницу:', nextPageIdToLoad);
      }
      
      // Пробуем загрузить следующую страницу
      try {
        console.log('Попытка загрузить страницу:', nextPageIdToLoad);
        
        // Загружаем текст и аудио
        await loadPageTextAndAudio(bookId, nextPageIdToLoad);
        
        // Успешно загрузили следующую страницу
        console.log('Страница', nextPageIdToLoad, 'успешно загружена');
        
        // Создаем информацию о новой странице
        const newPageInfo: {
          pageId: number;
          previousPageId?: number;
          nextPageId?: number;
        } = {
          pageId: nextPageIdToLoad,
          previousPageId: pageId,
          nextPageId: nextPageIdToLoad + 1
        };
        
        // Проверяем, есть ли страница после этой
        try {
          await getPageText(bookId, nextPageIdToLoad + 1);
          console.log('Следующая страница', nextPageIdToLoad + 1, 'существует');
          // Оставляем nextPageId как есть
        } catch (err: any) {
          if (err.status === 404) {
            console.log('Следующей страницы нет, это последняя страница');
            delete newPageInfo.nextPageId;
            setIsLastPage(true);
          }
        }
        
        setPageInfo(newPageInfo);
        setCurrentAudioPageId(nextPageIdToLoad);
        
        if (!newPageInfo.nextPageId) {
          setIsLastPage(true);
        } else {
          setIsLastPage(false);
        }
        
      } catch (err: any) {
        if (err.status === 404) {
          // Следующая страница не найдена - это конец книги
          console.log('Следующая страница не найдена, книга завершена');
          setIsLastPage(true);
          
          // Обновляем текущую страницу как последнюю
          if (pageInfo) {
            const updatedInfo = {
              ...pageInfo,
              nextPageId: undefined
            };
            setPageInfo(updatedInfo);
          }
          
          setPageText(`Вы на последней странице книги "${bookTitle}".
          
Нажмите кнопку с флажком, чтобы отметить книгу как прочитанную.`);
          
          // Показываем модальное окно завершения
          setShowCompletionModal(true);
        } else {
          // Другая ошибка
          console.error('Ошибка загрузки следующей страницы:', err);
          setError(`Ошибка загрузки страницы: ${err.message}`);
        }
      }
      
    } catch (err: any) {
      console.error('Ошибка перехода на следующую страницу:', err);
      
      if (err.status === 404) {
        setIsLastPage(true);
        setError('Вы достигли последней страницы книги');
      } else {
        setError(`Ошибка: ${err.message}`);
      }
    } finally {
      setIsSavingProgress(false);
    }
  };

  // Функция воспроизведения/паузы
  const togglePlay = async () => {
    console.log('togglePlay вызвана, isPlaying:', isPlaying, 'isDemoBook:', isDemoBook);
    
    // Если демо-книга
    if (isDemoBook) {
      setError('Аудио недоступно для демо-книг');
      return;
    }
    
    // Если нет аудио элемента, создаем
    if (!audioRef.current) {
      audioRef.current = new Audio();
      setupAudioEventListeners();
    }
    
    if (isPlaying) {
      // Пауза
      console.log('Ставим на паузу');
      if (audioRef.current) {
        audioRef.current.pause();
      }
    } else {
      // Воспроизведение
      console.log('Пытаемся воспроизвести');
      
      // Если аудио не загружено, загружаем
      if (!audioBlob) {
        console.log('Аудио не загружено, загружаем...');
        const loadedAudio = await loadPageAudio();
        if (!loadedAudio) {
          setError('Не удалось загрузить аудио для этой страницы');
          return;
        }
      }
      
      // Проверяем, есть ли src у audio элемента
      if (!audioRef.current.src && audioUrl) {
        console.log('Устанавливаем src из audioUrl');
        audioRef.current.src = audioUrl;
      } else if (!audioUrl) {
        console.error('audioUrl не существует');
        setError('Аудио не загружено');
        return;
      }
      
      // Пытаемся воспроизвести
      try {
        await audioRef.current.play();
        console.log('Воспроизведение успешно начато');
      } catch (playError: any) {
        console.error('Ошибка воспроизведения:', playError);
        
        if (playError.name === 'NotAllowedError') {
          setError('Автовоспроизведение заблокировано. Разрешите воспроизведение в браузере.');
        } else if (playError.name === 'NotSupportedError') {
          setError('Формат аудио не поддерживается');
        } else {
          setError(`Ошибка воспроизведения: ${playError.message}`);
        }
      }
    }
  };

  // Функция остановки
  const stopPlayback = () => {
    console.log('Остановка воспроизведения');
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  // Кнопка "Следующая страница"
  const handleNextPage = async () => {
    if (isLastPage) {
      // Если это последняя страница, показываем модальное окно завершения
      handleFinishReading();
      return;
    }
    
    if (bookId && currentAudioPageId !== null) {
      // Останавливаем текущее воспроизведение
      stopPlayback();
      await saveProgressAndLoadNext(bookId, currentAudioPageId);
    }
  };

  // Кнопка "Предыдущая страница"
  const handlePrevPage = async () => {
    if (pageInfo?.previousPageId !== undefined && bookId) {
      console.log('Переход на предыдущую страницу:', pageInfo.previousPageId);
      
      stopPlayback();
      setIsLoading(true);
      
      try {
        const prevPageId = pageInfo.previousPageId;
        
        if (isDemoBook) {
          // Для демо-книг
          const newInfo = {
            pageId: prevPageId,
            previousPageId: prevPageId > 1 ? prevPageId - 1 : undefined,
            nextPageId: prevPageId + 1
          };
          
          setPageInfo(newInfo);
          setCurrentAudioPageId(prevPageId);
          
          setPageText(`Страница ${prevPageId} демо-книги "${bookTitle}".
          
Это демонстрационный текст страницы ${prevPageId}.`);
          setIsLastPage(false);
        } else {
          // Для реальных книг - загружаем текст и аудио
          await loadPageTextAndAudio(bookId, prevPageId);
          
          const newInfo = {
            pageId: prevPageId,
            previousPageId: prevPageId > 1 ? prevPageId - 1 : undefined,
            nextPageId: prevPageId + 1
          };
          
          setPageInfo(newInfo);
          setCurrentAudioPageId(prevPageId);
          setIsLastPage(false);
        }
      } catch (err: any) {
        console.error('Ошибка загрузки предыдущей страницы:', err);
        setError(`Ошибка: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Выбор конкретной страницы
  const handlePageSelect = async (page: number) => {
    console.log('Выбрана страница:', page);
    
    // Останавливаем текущее воспроизведение
    stopPlayback();
    setAudioBlob(null); // Сбрасываем аудио при смене страницы
    
    if (isDemoBook) {
      // Для демо-книг
      const newInfo = {
        pageId: page,
        previousPageId: page > 1 ? page - 1 : undefined,
        nextPageId: page < 10 ? page + 1 : undefined
      };
      
      setPageInfo(newInfo);
      setCurrentAudioPageId(page);
      
      setPageText(`Страница ${page} демо-книги "${bookTitle}".
      
Это демонстрационный текст страницы ${page}.`);
      
      if (page >= 10) {
        setIsLastPage(true);
      } else {
        setIsLastPage(false);
      }
    } else {
      // Для реальных книг
      setIsLoading(true);
      
      try {
        // Загружаем текст и аудио
        await loadPageTextAndAudio(bookId!, page);
        
        const newInfo: {
          pageId: number;
          previousPageId?: number;
          nextPageId?: number;
        } = {
          pageId: page,
          previousPageId: page > 1 ? page - 1 : undefined,
          nextPageId: page + 1
        };
        
        // Проверяем, есть ли следующая страница
        try {
          await getPageText(bookId!, page + 1);
          console.log('Следующая страница существует');
        } catch (err: any) {
          if (err.status === 404) {
            console.log('Следующей страницы нет');
            delete newInfo.nextPageId;
            setIsLastPage(true);
          }
        }
        
        setPageInfo(newInfo);
        setCurrentAudioPageId(page);
        
        if (!newInfo.nextPageId) {
          setIsLastPage(true);
        } else {
          setIsLastPage(false);
        }
        
      } catch (err: any) {
        console.error('Ошибка загрузки выбранной страницы:', err);
        if (err.status === 404) {
          setError(`Страница ${page} не найдена`);
        } else {
          setError(`Ошибка: ${err.message}`);
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Кнопка "Начать сначала"
  const handleStartFromBeginning = async () => {
    if (!bookId) return;
    
    stopPlayback();
    setAudioBlob(null);
    setIsLoading(true);
    
    try {
      if (isDemoBook) {
        initializeDemoBook();
      } else {
        await loadFirstRealPage();
      }
      setIsLastPage(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Кнопка "Завершить чтение" (флажок)
  const handleFinishReading = async () => {
    if (!bookId || currentAudioPageId === null) return;
    
    stopPlayback();
    
    if (!isDemoBook) {
      setIsSavingProgress(true);
      try {
        await saveFinishedPage(bookId, currentAudioPageId);
        console.log('Книга отмечена как прочитанная');
      } catch (err: any) {
        console.warn('Не удалось сохранить завершение книги:', err);
      } finally {
        setIsSavingProgress(false);
      }
    }
    
    setShowCompletionModal(true);
  };

  // Закрыть модальное окно завершения книги
  const handleCloseCompletionModal = () => {
    setShowCompletionModal(false);
  };

  // При монтировании инициализируем книгу
  useEffect(() => {
    if (bookId && !hasInitialized.current) {
      hasInitialized.current = true;
      initializeBook();
    }
    
    return () => {
      hasInitialized.current = false;
      stopPlayback();
    };
  }, [bookId]);

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Рассчитываем процент прочитанного
  const getProgressPercentage = () => {
    if (!pageInfo || totalPages === 0) return 0;
    return ((pageInfo.pageId) / totalPages) * 100;
  };

  // Генерация опций для выбора страницы
  const generatePageOptions = () => {
    const pagesCount = isDemoBook ? 10 : totalPages;
    return Array.from({ length: pagesCount }, (_, i) => ({
      value: (i + 1).toString(),
      content: `Стр. ${i + 1}`
    }));
  };

  if (isLoading) {
    return (
      <Flex justifyContent="center" alignItems="center" className={styles.loading}>
        <Loader size="l" />
        <Text variant="body-2" color="secondary">Загрузка книги...</Text>
      </Flex>
    );
  }

  return (
    <div className={styles.bookContainer}>
      {/* Заголовок книги */}
      <div className={styles.bookHeader}>
        <div className={styles.bookMeta}>
          <Text variant="header-2" className={styles.bookTitle}>
            {bookTitle}
            {isDemoBook && <span style={{ fontSize: '14px', color: 'var(--g-color-text-secondary)', marginLeft: '8px' }}>(демо)</span>}
          </Text>
          <Text variant="body-2" className={styles.bookAuthor}>
            {bookAuthor}
          </Text>
        </div>
        
        {!isDemoBook && pageInfo && pageInfo.pageId > 1 && (
          <Button
            view="outlined"
            size="s"
            onClick={handleStartFromBeginning}
            disabled={isLoading || isSavingProgress}
            style={{ marginLeft: 'auto' }}
          >
            Начать сначала
          </Button>
        )}
      </div>

      {error && (
        <div style={{ padding: '8px 16px' }}>
          <Alert
            theme={isLastPage ? "success" : isDemoBook ? "info" : "warning"}
            title={isLastPage ? "Последняя страница" : "Внимание"}
            message={error}
            view="outlined"
            onClose={() => setError(null)}
          />
        </div>
      )}

      {isSavingProgress && !isDemoBook && (
        <div style={{ padding: '8px 16px' }}>
          <Alert
            theme="info"
            title="Сохранение прогресса"
            message="Прогресс чтения сохраняется..."
            view="outlined"
          />
        </div>
      )}

      {/* Основное содержание книги */}
      <div className={styles.bookContent}>
        <div className={styles.pageContent}>
          <div className={styles.textContent}>
            {pageText ? (
              pageText.split('\n').map((paragraph, idx) => (
                paragraph.trim() && (
                  <Text 
                    key={idx} 
                    variant="body-1" 
                    className={styles.paragraph}
                    style={{ 
                      fontSize: '18px',
                      lineHeight: 1.8,
                      fontFamily: "'Georgia', 'Times New Roman', serif"
                    }}
                  >
                    {paragraph}
                  </Text>
                )
              ))
            ) : (
              <Text variant="body-2" color="secondary" style={{ textAlign: 'center', padding: '40px' }}>
                {bookId ? 'Загрузка текста...' : 'Выберите книку для чтения'}
              </Text>
            )}
          </div>
          
          <div className={styles.pageFooter}>
            <Text variant="caption-1">
              Страница {pageInfo ? pageInfo.pageId : '--'} из {isDemoBook ? 10 : totalPages}
              {isSavingProgress && ' (сохранение...)'}
              {isLastPage && ' (последняя)'}
              {isDemoBook && ' (демо)'}
              {audioBlob && !isDemoBook && ` • Аудио загружено (${Math.round(audioBlob.size / 1024)} KB)`}
            </Text>
          </div>
        </div>
      </div>

      {/* Основные кнопки управления */}
      <div className={styles.playerControls}>
        <div className={styles.controlsRow}>
          {/* Выбор страницы */}
          

          {/* Центральная группа кнопок */}
          <div className={styles.centerControls}>
            {/* Кнопка "Назад" */}
            <Button
              view="outlined"
              size="xl"
              onClick={handlePrevPage}
              disabled={!pageInfo?.previousPageId || isLoading || isSavingProgress}
              className={styles.navButton}
              title="Предыдущая страница"
            >
              <Icon data={ArrowLeft} size={16} />
            </Button>
            
            {/* Кнопка "Воспроизведение/Пауза" */}
            <Button
              view={isPlaying ? "action" : "outlined"}
              size="xl"
              onClick={togglePlay}
              className={styles.playButton}
              title={isPlaying ? "Пауза" : "Воспроизведение"}
              disabled={Boolean(
                isLoadingAudio || 
                !bookId || 
                isSavingProgress || 
                (isLastPage && !isDemoBook) ||
                isDemoBook  // Для демо-книг кнопка заблокирована
              )}
              loading={isLoadingAudio}
            >
              <Icon data={isPlaying ? Pause : Play} size={20} />
            </Button>
            
            {/* Кнопка "Стоп" */}
            <Button
              view="outlined"
              size="xl"
              onClick={stopPlayback}
              disabled={!isPlaying || isSavingProgress}
              className={styles.navButton}
              title="Остановить"
            >
              <Icon data={Stop} size={16} />
            </Button>
            
            {/* Кнопка "Вперед" */}
            <Button
              view={isLastPage ? "action" : "outlined"}
              size="xl"
              onClick={handleNextPage}
              disabled={Boolean(isLoading || isSavingProgress || !bookId)}
              className={styles.navButton}
              title={isLastPage ? (isDemoBook ? "Завершить демо" : "Завершить чтение") : "Следующая страница"}
              loading={isSavingProgress && isLastPage}
            >
              <Icon data={isLastPage ? Flag : ArrowRight} size={16} />
            </Button>
          </div>
        </div>

        {/* Прогресс-бар */}
        <div className={styles.progressContainer}>
          <Progress
            value={getProgressPercentage()}
            size="m"
          />
        </div>
      </div>

      {/* Модальное окно завершения книги */}
      <Modal 
        open={showCompletionModal} 
        onClose={handleCloseCompletionModal}
      >
        <div style={{ padding: '24px' }}>
          <Flex direction="column" alignItems="center" gap="3">
            <Icon data={Flag} size={64} style={{ color: 'var(--g-color-base-success)' }} />
            <Text variant="header-2" style={{ textAlign: 'center' }}>
              {isDemoBook ? 'Демо-версия завершена!' : 'Поздравляем!'}
            </Text>
            <Text variant="body-2" style={{ textAlign: 'center' }}>
              "{bookTitle}" {isDemoBook ? 'демо-версия' : ''} прочитана до конца.
            </Text>
            <Text variant="body-2" color="secondary" style={{ textAlign: 'center' }}>
              {isDemoBook 
                ? 'Вы можете выбрать другую книгу или добавить настоящие книги через коллекцию.' 
                : 'Ваш прогресс сохранен. Вы можете выбрать другую книгу для чтения.'}
            </Text>
          </Flex>
        </div>
        <div style={{ 
          padding: '16px 24px', 
          borderTop: '1px solid var(--g-color-line-generic)',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <Button view="action" size="l" onClick={handleCloseCompletionModal}>
            Отлично!
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default Book;