import { makeAutoObservable, runInAction } from 'mobx';
import { getCollection, createBook, deleteBook } from '../api/fetchers';
import type { Book } from '../api/types';

// Создаем расширенный тип для книг с флагом демо
interface DemoBook extends Book {
  isDemo?: boolean;
}

// Тестовые книги для демонстрации
const demoBooks: DemoBook[] = [
  
];

class BookStore {
  books: DemoBook[] = [...demoBooks];
  isLoading = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
    this.loadBooks();
  }

  loadBooks = async () => {
  this.isLoading = true;
  this.error = null;
  
  try {
    console.log("🔄 BookStore: Загрузка коллекции книг...");
    const response = await getCollection();
    console.log("📦 BookStore: Ответ от API:", response);
    
    runInAction(() => {
      const serverBooks = response.collection?.books || [];
      console.log(`📚 BookStore: Получено ${serverBooks.length} книг с сервера`);
      
      // Добавляем флаг isDemo: false для книг с сервера
      const serverBooksWithFlag: DemoBook[] = serverBooks.map(book => ({
        ...book,
        title: book.bookTitle || book.title || 'Без названия',
        author: book.author || 'Неизвестный автор',
        isDemo: false
      }));
      
      console.log("🎨 BookStore: Обработанные серверные книги:", serverBooksWithFlag);
      
      // Объединяем книги
      const allBooksMap = new Map<string, DemoBook>();
      
      // Сначала добавляем серверные книги
      serverBooksWithFlag.forEach(book => {
        const id = book._id || book.bookId;
        if (id) {
          allBooksMap.set(id, book);
          console.log(`➕ Добавлена серверная книга: ${book.title} (${id})`);
        }
      });
      
      // Затем добавляем демо-книги
      demoBooks.forEach(book => {
        const id = book._id || book.bookId;
        if (id && !allBooksMap.has(id)) {
          allBooksMap.set(id, book);
          console.log(`➕ Добавлена демо-книга: ${book.title} (${id})`);
        }
      });
      
      this.books = Array.from(allBooksMap.values());
      this.isLoading = false;
      console.log(`🏁 BookStore: Всего ${this.books.length} книг в коллекции`);
    });
  } catch (error: any) {
    console.error("❌ BookStore: Ошибка загрузки:", error);
    runInAction(() => {
      if (error.message !== 'Требуется авторизация') {
        this.error = `Сервер временно недоступен. Используются демо-данные. (${error.message})`;
        console.log("ℹ️ BookStore: Используем демо-книги из-за ошибки");
      }
      this.isLoading = false;
    });
  }
};

  // ... остальные методы остаются без изменений ...
  
  addBook = async (bookData: {
    title: string;
    author?: string;
    file?: File;
    fileName?: string;
    fileUrl?: string;
  }) => {
    console.log("Добавление книги:", bookData);
    this.isLoading = true;
    this.error = null;
    
    try {
      const response = await createBook(bookData.title, bookData.author, bookData.file);
      console.log("Ответ от сервера при создании книги:", response);
      
      const newBook = response.book;
      
      const enhancedBook: DemoBook = {
        ...newBook,
        title: newBook.bookTitle || newBook.title || bookData.title || 'Без названия',
        author: bookData.author || newBook.author || '',
        fileName: bookData.file?.name || newBook.fileName,
        fileUrl: bookData.fileUrl || newBook.fileUrl,
        isDemo: false
      };
      
      console.log("Улучшенная книга:", enhancedBook);
      
      runInAction(() => {
        this.books.push(enhancedBook);
        this.isLoading = false;
      });
      
      return enhancedBook;
    } catch (error: any) {
      console.error("Ошибка добавления книги:", error);
      
      if (error.message === 'Требуется авторизация') {
        throw error;
      }
      
      // Если сервер недоступен, добавляем локально
      const localId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const demoBook: DemoBook = {
        _id: localId,
        bookId: localId,
        bookTitle: bookData.title,
        title: bookData.title,
        author: bookData.author || 'Неизвестен',
        fileName: bookData.file?.name || bookData.fileName || `${bookData.title.replace(/\s+/g, '_')}.pdf`,
        fileUrl: bookData.fileUrl || '#',
        isDemo: true
      };
      
      runInAction(() => {
        this.books.push(demoBook);
        this.error = error.status === 500 
          ? `Сервер временно недоступен. Книга "${bookData.title}" добавлена локально.`
          : `Проблема с соединением. Книга "${bookData.title}" добавлена локально.`;
        this.isLoading = false;
      });
      
      return demoBook;
    }
  };

  removeBook = async (bookId: string) => {
    this.isLoading = true;
    this.error = null;
    
    try {
      // Проверяем, не демо ли это книга
      const book = this.getBookById(bookId);
      if (book?.isDemo) {
        // Для демо-книг просто удаляем локально
        runInAction(() => {
          this.books = this.books.filter(book => book._id !== bookId && book.bookId !== bookId);
          this.isLoading = false;
        });
        return;
      }
      
      // Для реальных книг удаляем с сервера
      await deleteBook(bookId);
      runInAction(() => {
        this.books = this.books.filter(book => book._id !== bookId && book.bookId !== bookId);
        this.isLoading = false;
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || 'Ошибка удаления книги';
        this.isLoading = false;
      });
      throw error;
    }
  };

  searchBooks = (query: string) => {
    if (!query.trim()) {
      return this.books;
    }
    
    const lowerQuery = query.toLowerCase();
    return this.books.filter(book => {
      const title = (book.bookTitle || book.title || '').toLowerCase();
      const author = (book.author || '').toLowerCase();
      return title.includes(lowerQuery) || author.includes(lowerQuery);
    });
  };

  getBookById = (id: string) => {
    return this.books.find(book => book._id === id || book.bookId === id);
  };

  updateBookLocal = (bookId: string, updates: Partial<DemoBook>) => {
    const index = this.books.findIndex(book => book._id === bookId || book.bookId === bookId);
    if (index !== -1) {
      this.books[index] = { ...this.books[index], ...updates };
    }
  };

  clearError = () => {
    this.error = null;
  };
}

export const bookStore = new BookStore();