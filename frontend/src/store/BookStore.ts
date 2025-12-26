import { makeAutoObservable, runInAction } from 'mobx';
import { getCollection, createBook, deleteBook } from '../api/fetchers';
import type { Book } from '../api/types';

// Тестовые книги для демонстрации
const demoBooks: Book[] = [
  {
    _id: '1',
    bookId: '1',
    bookTitle: 'Мастер и Маргарита',
    title: 'Мастер и Маргарита',
    author: 'Михаил Булгаков',
    fileName: 'master-i-margarita.pdf',
    fileUrl: '#'
  },
  {
    _id: '2',
    bookId: '2',
    bookTitle: '1984',
    title: '1984',
    author: 'Джордж Оруэлл',
    fileName: '1984.pdf',
    fileUrl: '#'
  },
  {
    _id: '3',
    bookId: '3',
    bookTitle: 'Преступление и наказание',
    title: 'Преступление и наказание',
    author: 'Фёдор Достоевский',
    fileName: 'crime-and-punishment.pdf',
    fileUrl: '#'
  },
  {
    _id: '4',
    bookId: '4',
    bookTitle: 'Война и мир',
    title: 'Война и мир',
    author: 'Лев Толстой',
    fileName: 'war-and-peace.pdf',
    fileUrl: '#'
  },
  {
    _id: '5',
    bookId: '5',
    bookTitle: 'Маленький принц',
    title: 'Маленький принц',
    author: 'Антуан де Сент-Экзюпери',
    fileName: 'little-prince.pdf',
    fileUrl: '#'
  },
  {
    _id: '6',
    bookId: '6',
    bookTitle: 'Гарри Поттер и философский камень',
    title: 'Гарри Поттер и философский камень',
    author: 'Джоан Роулинг',
    fileName: 'harry-potter.pdf',
    fileUrl: '#'
  }
];

class BookStore {
  books: Book[] = [...demoBooks]; // Начинаем с демо-книг
  isLoading = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
    this.loadBooks();
  }

  // Загрузить все книги
  loadBooks = async () => {
    this.isLoading = true;
    this.error = null;
    
    try {
      console.log("Загрузка коллекции книг...");
      const response = await getCollection();
      console.log("Получены книги с сервера:", response);
      runInAction(() => {
        // Объединяем демо-книги с книгами с сервера
        const serverBooks = response.collection.books || [];
        this.books = [...demoBooks, ...serverBooks];
        this.isLoading = false;
      });
    } catch (error: any) {
      console.warn("Сервер недоступен, используем демо-книги:", error.message);
      runInAction(() => {
        this.error = `Сервер временно недоступен. Используются демо-данные. (${error.message})`;
        this.isLoading = false;
      });
    }
  };

  // Добавить книгу
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
      // Используем bookTitle как обязательное поле для бэкенда
      const response = await createBook(bookData.title, bookData.file);
      console.log("Ответ от сервера при создании книги:", response);
      
      const newBook = response.book;
      
      // Добавляем дополнительные поля для совместимости с фронтендом
      const enhancedBook: Book = {
        ...newBook,
        title: newBook.bookTitle || newBook.title || bookData.title || 'Без названия',
        author: bookData.author || newBook.author || '',
        fileName: bookData.file?.name || newBook.fileName,
        fileUrl: bookData.fileUrl || newBook.fileUrl,
      };
      
      console.log("Улучшенная книга:", enhancedBook);
      
      runInAction(() => {
        this.books.push(enhancedBook);
        this.isLoading = false;
      });
      
      return enhancedBook;
    } catch (error: any) {
      console.error("Ошибка добавления книги:", error);
      
      // Если сервер недоступен, добавляем локально как демо-книгу
      const demoBook: Book = {
        _id: Date.now().toString(),
        bookId: Date.now().toString(),
        bookTitle: bookData.title,
        title: bookData.title,
        author: bookData.author || 'Неизвестен',
        fileName: bookData.file?.name || bookData.fileName,
        fileUrl: bookData.fileUrl || '#',
      };
      
      runInAction(() => {
        this.books.push(demoBook);
        this.error = `Сервер недоступен. Книга добавлена локально.`;
        this.isLoading = false;
      });
      
      return demoBook;
    }
  };

  // Удалить книгу
  removeBook = async (bookId: string) => {
    this.isLoading = true;
    this.error = null;
    
    try {
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

  // Поиск книг (локальный поиск)
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

  // Получить книгу по ID
  getBookById = (id: string) => {
    return this.books.find(book => book._id === id || book.bookId === id);
  };

  // Обновить локальные данные книги
  updateBookLocal = (bookId: string, updates: Partial<Book>) => {
    const index = this.books.findIndex(book => book._id === bookId || book.bookId === bookId);
    if (index !== -1) {
      this.books[index] = { ...this.books[index], ...updates };
    }
  };

  // Очистить ошибку
  clearError = () => {
    this.error = null;
  };
}

export const bookStore = new BookStore();