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

class InternalError {
  status: number;

  constructor(status: number) {
    this.status = status;
  }
}

// Функция для динамического получения sessionId
const getSessionId = (): string => {
  // Если мы уже на странице авторизации, просто возвращаем пустую строку
  if (window.location.pathname === '/auth' || window.location.pathname.includes('/auth')) {
    return '';
  }
  
  const sessionId = localStorage.getItem('sessionId');
  if (!sessionId) {
    // Сохраняем текущий путь для возврата после авторизации
    localStorage.setItem('redirectPath', window.location.pathname);
    // Редирект на страницу авторизации
    window.location.href = '/auth';
    throw new Error('Требуется авторизация');
  }
  
  return sessionId;
};

const fetchApi = async (endpoint: string, requestParams: RequestParams) => {
  const sessionId = getSessionId(); // Динамически получаем sessionId
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: requestParams.method,
    headers: {
      'Content-Type': 'application/json',
      'X-Session-Id': sessionId,
    },
    body: Object.keys(requestParams.body).length > 0 ? JSON.stringify(requestParams.body) : undefined,
  });

  if (!response.ok) {
    console.error(`[fetchers] Ошибка ${response.status} для ${endpoint}:`, await response.text());
    throw new InternalError(response.status);
  }

  // Для эндпоинтов, которые могут возвращать пустой ответ
  const contentType = response.headers.get('content-type');
  const contentLength = response.headers.get('content-length');
  
  // Проверяем, есть ли контент
  if (contentLength && parseInt(contentLength) === 0) {
    console.log(`[fetchers] ${endpoint}: пустой ответ`);
    return null;
  }
  
  // Проверяем, является ли ответ JSON
  if (contentType && contentType.includes('application/json')) {
    try {
      const data = await response.json();
      console.log(`[fetchers] ${endpoint}: получен JSON ответ`, data);
      return data;
    } catch (err) {
      console.error(`[fetchers] ${endpoint}: ошибка парсинга JSON:`, err);
      return null;
    }
  } else {
    console.log(`[fetchers] ${endpoint}: не-JSON ответ, возвращаем null`);
    return null;
  }
};

// Функция для загрузки файлов (multipart/form-data)
const fetchApiWithFile = async (endpoint: string, formData: FormData) => {
  const sessionId = getSessionId(); // Динамически получаем sessionId
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'X-Session-Id': sessionId, // Отправляем sessionId
    },
    body: formData,
  });

  if (!response.ok) {
    throw new InternalError(response.status);
  }

  const json = await response.json();
  return json;
};

// Аутентификация - эти функции НЕ требуют sessionId
export const authLogin = async (params: LoginRequest): Promise<LoginResponse> => {
  const response = await fetch(`${API_BASE_URL}login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new InternalError(response.status);
  }

  const json: LoginResponse = await response.json();
  localStorage.setItem('sessionId', json.sessionId);
  return json;
};

export const register = async (params: LoginRequest): Promise<LoginResponse> => {
  const response = await fetch(`${API_BASE_URL}register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new InternalError(response.status);
  }

  const json: LoginResponse = await response.json();
  localStorage.setItem('sessionId', json.sessionId);
  return json;
};

// Все остальные запросы используют fetchApi и автоматически отправляют sessionId
export const myself = async (): Promise<MyselfResponse> => {
  const response: MyselfResponse = await fetchApi('myself', {
    body: {},
    query: {},
    method: 'GET',
  });
  
  return response;
};

export const logout = async (): Promise<void> => {
  const sessionId = localStorage.getItem('sessionId');
  
  if (!sessionId) {
    console.log('[fetchers] Нет активной сессии для выхода');
    return;
  }
  
  console.log('[fetchers] Запрос логаута для сессии:', sessionId.substring(0, 8) + '...');
  
  try {
    const response = await fetch(`${API_BASE_URL}logout/`, {
      method: 'POST',
      headers: {
        'X-Session-Id': sessionId,
      },
    });

    if (!response.ok) {
      console.error(`[fetchers] Ошибка выхода из системы: ${response.status}`);
    } else {
      console.log('[fetchers] Успешный выход из системы');
    }
  } catch (error) {
    console.error('[fetchers] Ошибка при запросе логаута:', error);
  } finally {
    // ОЧИЩАЕМ ВСЕ ДАННЫЕ и КЭШ
    localStorage.clear(); // Очищаем ВСЁ localStorage
    
    // Также очищаем sessionStorage если используется
    sessionStorage.clear();
    
    // Принудительно очищаем кэш fetch API
    if ('caches' in window) {
      caches.keys().then(function(names) {
        for (let name of names) caches.delete(name);
      });
    }
    
    // Добавляем параметр к URL чтобы избежать кэширования при следующем входе
    const timestamp = new Date().getTime();
    window.location.href = `/auth?nocache=${timestamp}`;
  }
};

// Книги
export const getCollection = async (): Promise<CollectionResponse> => {
  const sessionId = getSessionId();
  
  console.log(`📚 [API] Запрос коллекции книг...`);
  console.log(`🔑 Session ID: ${sessionId.substring(0, 8)}...`);
  console.log(`🌐 URL: ${API_BASE_URL}collection/`);
  
  try {
    // Создаем AbortController для таймаута
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(`${API_BASE_URL}collection/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Id': sessionId,
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    
    console.log(`📥 [API] Статус ответа: ${response.status} ${response.statusText}`);
    
    // Получаем текст ответа
    const responseText = await response.text();
    console.log(`📄 Тело ответа (первые 500 символов):`, responseText.substring(0, 500));
    
    // Пробуем определить тип ответа
    if (!responseText.trim()) {
      console.log('ℹ️ [API] Пустой ответ от сервера');
      return {
        collection: {
          books: []
        }
      };
    }
    
    // Пробуем распарсить как JSON
    let data;
    try {
      data = JSON.parse(responseText);
      console.log('✅ [API] Успешно распарсен JSON');
    } catch (parseError) {
      console.error('❌ [API] Не удалось распарсить как JSON');
      console.log('ℹ️ [API] Ответ может быть HTML или другим форматом');
      
      // Проверяем, не HTML ли это
      if (responseText.toLowerCase().includes('<!doctype') || 
          responseText.toLowerCase().includes('<html')) {
        console.error('⚠️ [API] Сервер вернул HTML вместо JSON (возможно ошибка 500 или редирект)');
      }
      
      // Проверяем статус ответа
      if (!response.ok) {
        throw new InternalError(response.status);
      }
      
      return {
        collection: {
          books: []
        }
      };
    }
    
    // Проверяем структуру данных
    if (data.collection && Array.isArray(data.collection.books)) {
      console.log(`📚 [API] Получено ${data.collection.books.length} книг`);
      return data;
    } else if (Array.isArray(data.books)) {
      console.log(`📚 [API] Получено ${data.books.length} книг (альтернативная структура)`);
      return {
        collection: {
          books: data.books
        }
      };
    } else if (Array.isArray(data)) {
      console.log(`📚 [API] Получен массив из ${data.length} книг`);
      return {
        collection: {
          books: data
        }
      };
    } else {
      console.warn('⚠️ [API] Неожиданная структура ответа:', data);
      return {
        collection: {
          books: []
        }
      };
    }
  } catch (error: any) {
    console.error('💥 [API] Ошибка запроса коллекции:', error);
    
    if (error.name === 'AbortError') {
      console.error('⏰ [API] Таймаут запроса коллекции');
      throw new Error('Таймаут запроса к серверу');
    }
    
    if (error.message === 'Требуется авторизация') {
      throw error;
    }
    
    return {
      collection: {
        books: []
      }
    };
  }
};

export const getBook = async (bookId: string): Promise<BookResponse> => {
  const response: BookResponse = await fetchApi(`book/${bookId}`, {
    body: {},
    query: {},
    method: 'GET',
  });
  return response;
};

export const createBook = async (
  bookTitle: string, 
  author?: string,
  file?: File
): Promise<BookResponse> => {
  const formData = new FormData();
  formData.append('bookTitle', bookTitle);
  
  if (author) {
    formData.append('author', author);
  }
  
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

// Новые функции для работы с текущей страницей книги
export type CurrentPageInfo = {
  pageId: number;
  previousPageId?: number;
  nextPageId?: number;
};

export type CurrentPageText = {
  text: string;
};

export type FinishedPageRequest = {
  bookId: number;
  pageId: number;
};

// Получение информации о текущей странице книги (ИСПРАВЛЕНА)
// Получение информации о текущей странице книги (ИСПРАВЛЕНА)
export const getCurrentPageInfo = async (bookId: string): Promise<CurrentPageInfo | null> => {
  const sessionId = getSessionId();
  
  console.log(`[fetchers] Запрос текущей страницы для книги ${bookId}, sessionId: ${sessionId.substring(0, 8)}...`);
  
  const response = await fetch(`${API_BASE_URL}book/${bookId}/currentPage`, {
    method: 'GET',
    headers: {
      'X-Session-Id': sessionId,
    },
  });

  if (!response.ok) {
    console.error(`[fetchers] Ошибка получения текущей страницы: ${response.status}`);
    
    // Если 404, возможно, прогресса нет - возвращаем null
    if (response.status === 404) {
      console.log('[fetchers] Прогресс не найден (404)');
      return null;
    }
    
    throw new InternalError(response.status);
  }

  // Проверяем, есть ли контент
  const contentType = response.headers.get('content-type');
  const contentLength = response.headers.get('content-length');
  
  console.log(`[fetchers] Ответ получен, status: ${response.status}, content-type: ${contentType}, content-length: ${contentLength}`);
  
  if (contentLength && parseInt(contentLength) === 0) {
    console.log('[fetchers] Пустой ответ, возвращаем null');
    return null;
  }

  if (contentType && contentType.includes('application/json')) {
    try {
      const data = await response.json();
      console.log('[fetchers] JSON ответ:', data);
      return data;
    } catch (err) {
      console.error('[fetchers] Ошибка парсинга JSON:', err);
      return null;
    }
  } else {
    console.log('[fetchers] Не-JSON ответ, возвращаем null');
    return null;
  }
};

// Получение текста конкретной страницы
export const getPageText = async (bookId: string, pageId: number): Promise<CurrentPageText> => {
  const sessionId = getSessionId();
  
  console.log(`[fetchers] Запрос текста для книги ${bookId}, страница ${pageId}`);
  
  const response = await fetch(`${API_BASE_URL}book/${bookId}/page/${pageId}/text`, {
    method: 'GET',
    headers: {
      'X-Session-Id': sessionId,
    },
  });

  if (!response.ok) {
    console.error(`[fetchers] Ошибка получения текста: ${response.status}`);
    throw new InternalError(response.status);
  }

  return await response.json();
};

// Получение аудио конкретной страницы
export const getPageAudio = async (bookId: string, pageId: number): Promise<Blob> => {
  const sessionId = getSessionId();
  
  console.log(`[fetchers] Запрос аудио для книги ${bookId}, страница ${pageId}`);
  
  const response = await fetch(`${API_BASE_URL}book/${bookId}/page/${pageId}/audio`, {
    method: 'GET',
    headers: {
      'X-Session-Id': sessionId,
    },
  });

  if (!response.ok) {
    throw new InternalError(response.status);
  }

  return await response.blob();
};

// Сохранение прогресса прочтения страницы
export const saveFinishedPage = async (bookId: string, pageId: number): Promise<void> => {
  const requestBody: FinishedPageRequest = {
    bookId: Number(bookId),
    pageId
  };
  
  console.log(`[fetchers] Сохранение прогресса: книга ${bookId}, страница ${pageId}`);
  
  // Этот endpoint может возвращать пустой ответ (204 No Content)
  const sessionId = getSessionId();
  
  const response = await fetch(`${API_BASE_URL}player/finishedPage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Session-Id': sessionId,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    console.error(`[fetchers] Ошибка сохранения прогресса: ${response.status}`);
    throw new InternalError(response.status);
  }

  console.log(`[fetchers] Прогресс сохранен: bookId=${bookId}, pageId=${pageId}`);
};