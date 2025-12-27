import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { 
  Flex, 
  Text, 
  Button,
  Loader,
  Icon,
  TextInput
} from '@gravity-ui/uikit';
import Book from '../../components/BookPage/Book';
import { bookStore } from '../../store/BookStore';
import { getBook } from '../../api/fetchers';
import styles from './BookPage.module.css';
import type { Book as BookType } from '../../api/types';

// Создаем безопасный тип для книги
type SafeBook = {
  _id: string;
  bookId?: string;
  bookTitle: string;
  title?: string;
  author?: string;
  fileName?: string;
  fileUrl?: string;
  isDemo?: boolean;
};

export const BookPage: React.FC = observer(() => {
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [selectedBook, setSelectedBook] = useState<SafeBook | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Получить ID книги из URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const bookIdFromUrl = urlParams.get('bookId');
    if (bookIdFromUrl) {
      setSelectedBookId(bookIdFromUrl);
      loadBook(bookIdFromUrl);
    }
  }, []);

  // Функция для создания безопасного объекта книги
  const createSafeBook = (book: any): SafeBook => {
    return {
      _id: book._id || book.bookId || `temp_${Date.now()}`,
      bookId: book.bookId,
      bookTitle: book.bookTitle || book.title || 'Без названия',
      title: book.title,
      author: book.author,
      fileName: book.fileName,
      fileUrl: book.fileUrl,
      isDemo: book.isDemo
    };
  };

  // Загрузить книгу по ID
  const loadBook = async (bookId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Сначала ищем в локальном store
      const localBook = bookStore.getBookById(bookId);
      
      if (localBook) {
        setSelectedBook(createSafeBook(localBook));
      } else {
        // Если нет в локальном store, загружаем с сервера
        const response = await getBook(bookId);
        const safeBook = createSafeBook(response.book);
        safeBook.isDemo = false; // Книги с сервера не являются демо
        setSelectedBook(safeBook);
      }
    } catch (error: any) {
      setError(error.message || 'Не удалось загрузить книгу');
      console.error('Ошибка загрузки книги:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Обработчик выбора книги из списка
  const handleBookSelect = (book: BookType | SafeBook) => {
    const safeBook = createSafeBook(book);
    const bookId = safeBook._id;
    
    setSelectedBookId(bookId);
    setSelectedBook(safeBook);
    
    // Обновляем URL
    window.history.pushState({}, '', `/book?bookId=${bookId}`);
  };

  // Очистить выбранную книгу
  const handleClearSelection = () => {
    setSelectedBookId(null);
    setSelectedBook(null);
    setError(null);
    // Убираем параметр из URL
    window.history.replaceState({}, '', '/book');
  };

  // Получить первую букву для иконки книги
  const getBookInitial = (title: string) => {
    return title.charAt(0).toUpperCase();
  };

  // Получить цвет для обложки книги
  const getBookColor = (index: number, isDemo?: boolean) => {
    if (isDemo) {
      // Для демо-книг используем другой цвет
      return 'var(--g-color-base-generic)';
    }
    
    const colors = [
      'var(--g-color-base-brand)',
      'var(--g-color-base-success-heavy)',
      'var(--g-color-base-warning-heavy)',
      'var(--g-color-base-danger-heavy)',
      'var(--g-color-base-info-heavy)',
    ];
    return colors[index % colors.length];
  };

  // Отфильтрованные книги
  const filteredBooks = bookStore.searchBooks(searchQuery);

  return (
    <Flex className={styles.wrapper}>
      {/* Боковая панель с книгами */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <Text variant="header-2">📚 Мои книги</Text>
          <Text variant="caption-1" className={styles.bookCount}>
            {bookStore.books.length} книг в коллекции
          </Text>
          <TextInput
            placeholder="Поиск книг..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
            size="s"
          />
        </div>

        <div className={styles.sidebarContent}>
          {bookStore.isLoading ? (
            <div className={styles.loadingState}>
              <Loader size="m" />
              <Text variant="caption-1" color="secondary" style={{ marginTop: '8px' }}>
                Загрузка книг...
              </Text>
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className={styles.noBookSelected}>
              <Text variant="body-2" color="secondary">
                {searchQuery ? 'Книги не найдены' : 'Коллекция пуста'}
              </Text>
              {!searchQuery && (
                <Button 
                  view="outlined" 
                  size="s"
                  onClick={() => window.location.href = '/collection'}
                  style={{ marginTop: '8px' }}
                >
                  Добавить книги
                </Button>
              )}
            </div>
          ) : (
            filteredBooks.map((book, index) => {
              const isActive = selectedBookId === (book._id || book.bookId);
              const bookIsDemo = book.isDemo;

              return (
                <div
                  key={`${book._id || book.bookId || index}_${bookIsDemo ? 'demo' : 'real'}`}
                  className={`${styles.bookItem} ${isActive ? styles.active : ''}`}
                  onClick={() => handleBookSelect(book)}
                >
                  <div 
                    className={styles.bookCover}
                    style={{ 
                      backgroundColor: getBookColor(index, bookIsDemo),
                      opacity: bookIsDemo ? 0.8 : 1
                    }}
                  >
                    <Text variant="body-1" style={{ color: 'white' }}>
                      {getBookInitial(book.bookTitle || book.title || '')}
                    </Text>
                  </div>
                  <div className={styles.bookInfo}>
                    <Text variant="body-2" className={styles.bookTitle}>
                      {book.bookTitle || book.title || 'Без названия'}
                      {bookIsDemo && (
                        <span style={{ 
                          fontSize: '10px', 
                          color: 'var(--g-color-text-secondary)', 
                          marginLeft: '4px',
                          fontStyle: 'italic'
                        }}>
                          (демо)
                        </span>
                      )}
                    </Text>
                    <Text variant="caption-1" className={styles.bookAuthor}>
                      {book.author || 'Неизвестный автор'}
                    </Text>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Основная область с плеером */}
      <div className={styles.mainArea}>
        <div className={styles.mainHeader}>
          <Text variant="header-2">
            {selectedBook ? `📖 ${selectedBook.bookTitle} ${selectedBook.isDemo ? '(демо)' : ''}` : 'Читалка книг'}
          </Text>
          <div>
            {selectedBook && (
              <Button
                view="outlined"
                size="s"
                onClick={handleClearSelection}
              >
                Закрыть
              </Button>
            )}
          </div>
        </div>

        <div className={styles.readerContainer}>
          {/* Сообщение об ошибке */}
          {error && (
            <div className={styles.errorState}>
              <Icon data="alert" size={32} style={{ color: 'var(--g-color-base-danger)' }} />
              <Text variant="body-2" color="danger" style={{ textAlign: 'center', marginTop: '8px' }}>
                {error}
              </Text>
              <Button 
                size="s" 
                view="outlined"
                onClick={() => setError(null)}
                style={{ marginTop: '12px' }}
              >
                Закрыть
              </Button>
            </div>
          )}

          {/* Загрузка книги */}
          {isLoading ? (
            <div className={styles.loadingState}>
              <Loader size="l" />
              <Text variant="body-2" color="secondary" style={{ marginTop: '12px' }}>
                Загрузка книги...
              </Text>
            </div>
          ) : selectedBook ? (
            <Book
              bookId={selectedBook._id}
              bookTitle={selectedBook.bookTitle}
              bookAuthor={selectedBook.author || 'Неизвестный автор'}
              bookFileUrl={selectedBook.fileUrl}
              isDemo={selectedBook.isDemo}
            />
          ) : (
            <div className={styles.noBookSelected}>
              <div className={styles.welcomeIllustration}>📚</div>
              <Text variant="header-2">Добро пожаловать в читалку!</Text>
              <Text variant="body-2" color="secondary" className={styles.welcomeText}>
                Выберите книгу из списка слева, чтобы начать чтение.
                <br />
                <span style={{ fontSize: '12px', color: 'var(--g-color-text-hint)' }}>
                  Книги с пометкой (демо) доступны без подключения к серверу.
                </span>
              </Text>
              {bookStore.books.length === 0 && (
                <Button 
                  view="action" 
                  size="m"
                  onClick={() => window.location.href = '/collection'}
                  style={{ marginTop: '16px' }}
                >
                  Перейти в коллекцию
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </Flex>
  );
});