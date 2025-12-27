export type User = {
  login: string;
}

export type AuthResponse = {
  sessionId: string;
}

export type LoginRequest = {
  login: string;
  password: string;
}

export type LoginResponse = AuthResponse;

export type RegisterRequest = {
  login: string;
  password: string;
}

export type RegisterResponse = AuthResponse;

export type MyselfResponse = User;

// Типы для книг
export type Book = {
  _id: string;
  bookId?: string;
  bookTitle: string;
  title?: string;
  author?: string;
  fileName?: string;
  fileUrl?: string;
  bookUrl?: string; // Добавьте это свойство
  createdAt?: string;
  updatedAt?: string;
  isDemo?: boolean;
};

export type CollectionResponse = {
  collection: {
    books: Book[];
  };
};

export type BookResponse = {
  book: Book;
};

export type DeleteResponse = {
  message: string;
};

// Новые типы для работы с текущей страницей книги
export type CurrentPageInfo = {
  pageId: number;
  previousPageId?: number;
  nextPageId?: number;
};

export type CurrentPageText = {
  text: string;
};

export type FinishedPageRequest = {
  bookId: string;
  pageId: number;
};

