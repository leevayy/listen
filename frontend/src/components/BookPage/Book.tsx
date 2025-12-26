import React, { useState, useEffect, useRef } from 'react';
import { 
  Button, 
  Flex, 
  Text, 
  Progress,
  Select,
  Loader
} from '@gravity-ui/uikit';
import styles from './Book.module.css';

type BookPage = {
  pageNumber: number;
  content: string;
};

type BookProps = {
  bookTitle: string;
  bookAuthor: string;
  bookFile?: File | null;
  bookFileUrl?: string;
};

export const Book: React.FC<BookProps> = ({
  bookTitle,
  bookAuthor,
  bookFile,
  bookFileUrl
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [bookPages, setBookPages] = useState<BookPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoScroll, setAutoScroll] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(1);
  const [fontSize, setFontSize] = useState(18);
  const [lineHeight, setLineHeight] = useState(1.8);
  
  
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<number | null>(null);

  // Цветовые темы с контрастными цветами для текста
  const themeStyles = {
    light: {
      backgroundColor: 'var(--g-color-base-background)',
      textColor: 'var(--g-color-text-primary)',
      contentBackground: 'white',
      paragraphColor: 'var(--g-color-text-primary)',
      borderColor: 'var(--g-color-line-generic)',
      panelBackground: 'var(--g-color-base-background)',
      buttonColor: 'var(--g-color-base-brand)',
      buttonHoverColor: 'var(--g-color-base-brand-heavy)',
      buttonTextColor: 'white',
      buttonBorderColor: 'var(--g-color-base-brand)',
      sliderColor: 'var(--g-color-base-brand)'
    },
    dark: {
      backgroundColor: '#1a1a1a',
      textColor: '#ffffff', // Белый для основного текста
      contentBackground: '#2d2d2d',
      paragraphColor: '#e6e6e6',
      borderColor: '#444',
      panelBackground: '#1a1a1a',
      buttonColor: '#4a90e2',
      buttonHoverColor: '#357ae8',
      buttonTextColor: 'white',
      buttonBorderColor: '#4a90e2',
      sliderColor: '#4a90e2'
    },
    sepia: {
      backgroundColor: '#f4ecd8',
      textColor: '#5b4636',
      contentBackground: '#f8f4e9',
      paragraphColor: '#5b4636',
      borderColor: '#d4c4a8',
      panelBackground: '#f4ecd8',
      buttonColor: '#b58900',
      buttonHoverColor: '#a07900',
      buttonTextColor: 'white',
      buttonBorderColor: '#b58900',
      sliderColor: '#b58900'
    }
  };

  const [theme, setTheme] = useState<'light' | 'dark' | 'sepia'>('dark'); // По умолчанию темная тема

  // Генерация демо-содержимого книги
  const generateDemoContent = (): BookPage[] => {
    const pages: BookPage[] = [];
    const loremIpsum = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";
    
    for (let i = 1; i <= 50; i++) {
      const pageContent = `Страница ${i}. ${bookTitle} - ${bookAuthor}\n\n${loremIpsum.repeat(3)}\n\n`;
      pages.push({
        pageNumber: i,
        content: pageContent
      });
    }
    
    return pages;
  };

  // Загрузка и обработка файла книги
  const loadBookContent = async () => {
    setLoading(true);
    try {
      let textContent = '';
      
      if (bookFile) {
        textContent = await bookFile.text();
      } else if (bookFileUrl && bookFileUrl !== '#') {
        const response = await fetch(bookFileUrl);
        textContent = await response.text();
      } else {
        // Используем демо-контент
        const pages = generateDemoContent();
        setBookPages(pages);
        setTotalPages(pages.length);
        setCurrentPage(1);
        setLoading(false);
        return;
      }
      
      // Разбиваем текст на страницы
      const words = textContent.split(/\s+/);
      const pages: BookPage[] = [];
      const wordsPerPage = 500;
      
      for (let i = 0; i < words.length; i += wordsPerPage) {
        const pageWords = words.slice(i, i + wordsPerPage);
        pages.push({
          pageNumber: pages.length + 1,
          content: pageWords.join(' ')
        });
      }
      
      setBookPages(pages);
      setTotalPages(pages.length);
      setCurrentPage(1);
    } catch (error) {
      console.error('Ошибка загрузки книги:', error);
      const pages = generateDemoContent();
      setBookPages(pages);
      setTotalPages(pages.length);
      setCurrentPage(1);
    } finally {
      setLoading(false);
    }
  };

  // Автопрокрутка
  useEffect(() => {
    if (autoScroll && contentRef.current) {
      scrollIntervalRef.current = window.setInterval(() => {
        setCurrentPage(prev => {
          if (prev >= totalPages) {
            setAutoScroll(false);
            return prev;
          }
          return prev + 1;
        });
      }, 10000 / scrollSpeed);
    } else if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
    }

    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    };
  }, [autoScroll, scrollSpeed, totalPages]);

  // Прокрутка к началу страницы
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [currentPage]);

  // Загружаем книгу при монтировании
  useEffect(() => {
    if (bookTitle) {
      loadBookContent();
    }
  }, [bookTitle]);

  // Обработчики навигации
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handlePageSelect = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Рассчитываем процент прочитанного
  const getProgressPercentage = () => {
    return totalPages > 0 ? (currentPage / totalPages) * 100 : 0;
  };

  if (loading) {
    return (
      <Flex justifyContent="center" alignItems="center" className={styles.loading}>
        <Loader size="l" />
        <Text variant="body-2" color="secondary">Загрузка книги...</Text>
      </Flex>
    );
  }

  if (!bookPages.length) {
    return (
      <Flex justifyContent="center" alignItems="center" className={styles.noContent}>
        <Text variant="body-2" color="secondary">
          Не удалось загрузить содержимое книги.
        </Text>
      </Flex>
    );
  }

  const currentTheme = themeStyles[theme];

  return (
    <div 
      className={styles.bookContainer}
      style={{ backgroundColor: currentTheme.backgroundColor }}
    >
      {/* Заголовок книги */}
      <div 
        className={styles.bookHeader}
        style={{ 
          backgroundColor: currentTheme.backgroundColor,
          borderBottomColor: currentTheme.borderColor
        }}
      >
        <div className={styles.bookMeta}>
          <Text 
            variant="header-2" 
            className={styles.bookTitle}
            style={{ color: currentTheme.textColor }}
          >
            {bookTitle}
          </Text>
          <Text 
            variant="body-2" 
            className={styles.bookAuthor}
            style={{ color: currentTheme.textColor }}
          >
            {bookAuthor}
          </Text>
        </div>
      </div>

      {/* Основное содержание книги */}
      <div 
        className={styles.bookContent} 
        ref={contentRef}
        style={{ 
          backgroundColor: currentTheme.backgroundColor,
        }}
      >
        <div 
          className={styles.pageContent}
          style={{ 
            backgroundColor: currentTheme.contentBackground,
            boxShadow: theme === 'dark' ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.08)'
          }}
        >
          <div className={styles.textContent}>
            {bookPages[currentPage - 1]?.content.split('\n').map((paragraph, idx) => (
              paragraph.trim() && (
                <Text 
                  key={idx} 
                  variant="body-1" 
                  className={styles.paragraph}
                  style={{ 
                    fontSize: `${fontSize}px`,
                    lineHeight: lineHeight,
                    color: currentTheme.paragraphColor,
                    fontFamily: "'Georgia', 'Times New Roman', serif"
                  }}
                >
                  {paragraph}
                </Text>
              )
            ))}
          </div>
          
          <div 
            className={styles.pageFooter}
            style={{ borderTopColor: currentTheme.borderColor }}
          >
            <Text 
              variant="caption-1" 
              style={{ 
                color: theme === 'dark' ? '#999' : 'var(--g-color-text-secondary)'
              }}
            >
              Страница {currentPage} из {totalPages}
            </Text>
          </div>
        </div>
      </div>

      {/* Основные кнопки управления - ВСЕГДА ВИДНЫ ВНИЗУ */}
      <div 
        className={styles.playerControls}
        style={{ 
          backgroundColor: currentTheme.panelBackground,
          borderTopColor: currentTheme.borderColor,
          boxShadow: theme === 'dark' ? '0 -4px 20px rgba(0,0,0,0.3)' : '0 -4px 20px rgba(0,0,0,0.1)'
        }}
      >
        <div className={styles.controlsRow}>
          {/* Выбор страницы - ЛЕВЫЙ КРАЙ */}
          <div className={styles.pageSelectorContainer}>
            <Select
              value={[currentPage.toString()]}
              onUpdate={(value: string[]) => handlePageSelect(Number(value[0]))}
              options={Array.from({ length: totalPages }, (_, i) => ({
                value: (i + 1).toString(),
                content: `Стр. ${i + 1}`
              }))}
              size="m"
              placeholder="Страница..."
              width={100}
              className={styles.pageSelect}
            />
          </div>

          {/* Центральная группа кнопок - СТРОГО ПО ЦЕНТРУ */}
          <div className={styles.centerControls}>
            {/* Кнопка "Назад" */}
            <Button
              view="outlined"
              size="xl"
              onClick={handlePrevPage}
              disabled={currentPage <= 1}
              className={styles.navButton}
              title="Предыдущая страница"
              style={{
                backgroundColor: currentTheme.backgroundColor,
                borderColor: currentTheme.buttonBorderColor,
              }}
            >
              <span className={styles.buttonIcon}>◄</span>
              <Text 
                variant="caption-2" 
                className={styles.buttonLabel}
                style={{ 
                  color: currentTheme.textColor
                }}
              >
              
              </Text>
            </Button>
            
            {/* Центральная кнопка "Воспроизведение/Пауза" */}
            <Button
              view={autoScroll ? "action" : "outlined"}
              size="xl"
              onClick={() => setAutoScroll(!autoScroll)}
              className={styles.playButton}
              title={autoScroll ? "Пауза" : "Воспроизведение"}
              style={{
                backgroundColor: autoScroll ? currentTheme.buttonColor : currentTheme.backgroundColor,
                borderColor: currentTheme.buttonBorderColor,
              }}
            >
              <span className={styles.buttonIcon}>
                {autoScroll ? '⏸' : '▷'}
              </span>
              <Text 
                variant="caption-2" 
                className={styles.buttonLabel}
                style={{ 
                  color: autoScroll ? currentTheme.buttonTextColor : currentTheme.textColor
                }}
              >
                {autoScroll ? '' : ''}
              </Text>
            </Button>
            
            {/* Кнопка "Вперед" */}
            <Button
              view="outlined"
              size="xl"
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
              className={styles.navButton}
              title="Следующая страница"
              style={{
                backgroundColor: currentTheme.backgroundColor,
                borderColor: currentTheme.buttonBorderColor,
              }}
            >
              <span className={styles.buttonIcon}>►</span>
              <Text 
                variant="caption-2" 
                className={styles.buttonLabel}
                style={{ 
                  color: currentTheme.textColor
                }}
              >
              
              </Text>
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
    </div>
  );
};