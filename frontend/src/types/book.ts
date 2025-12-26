export type Book = {
  _id: string;
  bookId?: string; // для совместимости
  bookTitle: string;
  title?: string; // для обратной совместимости
  author?: string;
  fileName?: string;
  fileUrl?: string;
  createdAt?: string;
  updatedAt?: string;
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