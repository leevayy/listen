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
import { Book } from '../../components/BookPage/Book';
import { bookStore } from '../../store/BookStore';
import { getBook } from '../../api/fetchers';
import styles from './BookPage.module.css';

type BookItem = {
  _id: string;
  bookId?: string;
  bookTitle: string;
  title?: string;
  author?: string;
  fileName?: string;
  fileUrl?: string;
};

export const BookPage: React.FC = observer(() => {
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [selectedBook, setSelectedBook] = useState<BookItem | null>(null);
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

  // Загрузить книгу по ID
  const loadBook = async (bookId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Сначала ищем в локальном store
      const localBook = bookStore.getBookById(bookId);
      
      if (localBook) {
        setSelectedBook({
          _id: localBook._id,
          bookId: localBook.bookId,
          bookTitle: localBook.bookTitle || localBook.title || '',
          author: localBook.author,
          fileName: localBook.fileName,
          fileUrl: localBook.fileUrl,
        });
      } else {
        // Если нет в локальном store, загружаем с сервера
        const response = await getBook(bookId);
        const serverBook = response.book;
        
        setSelectedBook({
          _id: serverBook._id,
          bookId: serverBook.bookId,
          bookTitle: serverBook.bookTitle || serverBook.title || '',
          author: serverBook.author,
          fileName: serverBook.fileName,
          fileUrl: serverBook.fileUrl,
        });
      }
    } catch (error: any) {
      setError(error.message || 'Не удалось загрузить книгу');
      console.error('Ошибка загрузки книги:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Обработчик выбора книги из списка
  const handleBookSelect = (book: BookItem) => {
    setSelectedBookId(book._id || book.bookId || '');
    setSelectedBook(book);
    
    // Обновляем URL
    const bookId = book._id || book.bookId || '';
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
  const getBookColor = (index: number) => {
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
      {/* Боковая панель с книгами (как чаты в Telegram) */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <Text variant="header-2">📚 Мои книги</Text>
          <Text variant="caption-1" color="secondary" style={{ marginTop: '8px' }}>
            {bookStore.books.length} книг в коллекции
          </Text>
          <TextInput
            placeholder="Поиск книг..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
            size="m"
          />
        </div>

        <div className={styles.sidebarContent}>
          {bookStore.isLoading ? (
            <Flex justifyContent="center" alignItems="center" style={{ padding: '40px' }}>
              <Loader size="m" />
              <Text variant="body-2" color="secondary" style={{ marginLeft: '12px' }}>
                Загрузка книг...
              </Text>
            </Flex>
          ) : filteredBooks.length === 0 ? (
            <Flex justifyContent="center" alignItems="center" style={{ padding: '40px', textAlign: 'center' }}>
              <Text variant="body-2" color="secondary">
                {searchQuery ? 'Книги не найдены' : 'Коллекция пуста'}
                <br />
                <Button 
                  view="outlined" 
                  size="m"
                  onClick={() => window.location.href = '/collection'}
                  style={{ marginTop: '16px' }}
                >
                  Добавить книги
                </Button>
              </Text>
            </Flex>
          ) : (
            filteredBooks.map((book, index) => {
              const isActive = selectedBookId === (book._id || book.bookId);
              return (
                <div
                  key={book._id || book.bookId}
                  className={`${styles.bookItem} ${isActive ? styles.active : ''}`}
                  onClick={() => handleBookSelect(book)}
                >
                  <div 
                    className={styles.bookCover}
                    style={{ backgroundColor: getBookColor(index) }}
                  >
                    <Text variant="header-2" style={{ color: 'white' }}>
                      {getBookInitial(book.bookTitle || book.title || '')}
                    </Text>
                  </div>
                  <div className={styles.bookInfo}>
                    <Text variant="body-2" className={styles.bookTitle}>
                      {book.bookTitle || book.title || 'Без названия'}
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
            {selectedBook ? `📖 ${selectedBook.bookTitle}` : 'Читалка книг'}
          </Text>
          <div>
            {selectedBook && (
              <Button
                view="outlined"
                size="m"
                onClick={handleClearSelection}
              >
                Закрыть книгу
              </Button>
            )}
          </div>
        </div>

        <div className={styles.readerContainer}>
          {/* Сообщение об ошибке */}
          {error && (
            <Flex direction="column" alignItems="center" gap="3" style={{ 
              maxWidth: '500px', 
              margin: '40px auto',
              padding: '20px'
            }}>
              <Icon data="alert" size={48} style={{ color: 'var(--g-color-base-danger)' }} />
              <Text variant="body-2" color="danger" style={{ textAlign: 'center' }}>
                {error}
              </Text>
              <Button 
                size="m" 
                view="outlined"
                onClick={() => setError(null)}
                style={{ marginTop: '16px' }}
              >
                Закрыть
              </Button>
            </Flex>
          )}

          {/* Загрузка книги */}
          {isLoading ? (
            <Flex direction="column" alignItems="center" justifyContent="center" style={{ flex: 1 }}>
              <Loader size="l" />
              <Text variant="body-2" color="secondary" style={{ marginTop: '16px' }}>
                Загрузка книги...
              </Text>
            </Flex>
          ) : selectedBook ? (
            <Book
              bookTitle={selectedBook.bookTitle}
              bookAuthor={selectedBook.author || 'Неизвестный автор'}
              bookFileUrl={selectedBook.fileUrl}
            />
          ) : (
            <Flex direction="column" alignItems="center" justifyContent="center" className={styles.noBookSelected}>
              <div className={styles.welcomeIllustration}>📚</div>
              <Text variant="header-2">Добро пожаловать в читалку!</Text>
              <Text variant="body-2" color="secondary" style={{ textAlign: 'center', maxWidth: '500px' }}>
                Выберите книгу из списка слева, чтобы начать чтение.
                <br />
                Используйте кнопки управления внизу для навигации по страницам.
              </Text>
              {bookStore.books.length === 0 && (
                <Button 
                  view="action" 
                  size="xl"
                  onClick={() => window.location.href = '/collection'}
                  style={{ marginTop: '24px' }}
                >
                  Перейти в коллекцию
                </Button>
              )}
            </Flex>
          )}
        </div>
      </div>
    </Flex>
  );
});