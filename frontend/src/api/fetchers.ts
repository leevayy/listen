import type { 
  LoginRequest, 
  LoginResponse, 
  MyselfResponse,
  CollectionResponse,
  BookResponse,
  DeleteResponse,
  Book
} from "./types";

const API_BASE_URL = 'http://158.160.73.166:8080/api/';

export type RequestParams = {
  body: Record<string, any>;
  query: Record<string, any>;
  method: 'POST' | 'GET' | 'PUT' | 'DELETE';
}

const sessionId = localStorage.getItem('sessionId') || '';

class InternalError {
  status: number;

  constructor(status: number) {
    this.status = status;
  }
}

const fetchApi = async (endpoint: string, requestParams: RequestParams) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: requestParams.method,
    headers: {
      'Content-Type': 'application/json',
      'X-Session-Id': sessionId,
    },
    body: Object.keys(requestParams.body).length > 0 ? JSON.stringify(requestParams.body) : undefined,
  });

  if (!response.ok) {
    throw new InternalError(response.status);
  }

  const json = await response.json();
  return json;
};

// Функция для загрузки файлов (multipart/form-data)
const fetchApiWithFile = async (endpoint: string, formData: FormData) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'X-Session-Id': sessionId,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new InternalError(response.status);
  }

  const json = await response.json();
  return json;
};

// Аутентификация
export const authLogin = async (params: LoginRequest) => {
  const response: LoginResponse = await fetchApi('login', {
    body: params,
    query: {},
    method: 'POST',
  });

  localStorage.setItem('sessionId', response.sessionId);
  return response;
};

export const register = async (params: LoginRequest) => {
  const response: LoginResponse = await fetchApi('register', {
    body: params,
    query: {},
    method: 'POST',
  });

  localStorage.setItem('sessionId', response.sessionId);
  return response;
};

export const myself = async () => {
  const response: MyselfResponse = await fetchApi('myself', {
    body: {},
    query: {},
    method: 'GET',
  });
  
  return response;
};

// Книги
export const getCollection = async (): Promise<CollectionResponse> => {
  const response: CollectionResponse = await fetchApi('collection/', {
    body: {},
    query: {},
    method: 'GET',
  });
  return response;
};

export const getBook = async (bookId: string): Promise<BookResponse> => {
  const response: BookResponse = await fetchApi(`book/${bookId}`, {
    body: {},
    query: {},
    method: 'GET',
  });
  return response;
};

export const createBook = async (bookTitle: string, file?: File): Promise<BookResponse> => {
  const formData = new FormData();
  formData.append('bookTitle', bookTitle);
  
  // Файл может быть опциональным
  if (file) {
    formData.append('file', file);
  }
  
  const response: BookResponse = await fetchApiWithFile('book/', formData);
  return response;
};

export const deleteBook = async (bookId: string): Promise<DeleteResponse> => {
  const response: DeleteResponse = await fetchApi(`book/${bookId}`, {
    body: {},
    query: {},
    method: 'DELETE',
  });
  return response;
};