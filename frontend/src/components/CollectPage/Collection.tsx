import {
    Button,
    Flex,
    Text,
    TextInput,
    Card,
} from "@gravity-ui/uikit";
import styles from "./Collection.module.css";
import { useState } from "react";
import { observer } from "mobx-react";
import { bookStore } from "../../store/BookStore";

type Props = {};

export const Collection: React.FC<Props> = observer(() => {
    const [title, setTitle] = useState("");
    const [author, setAuthor] = useState("");
    const [file, setFile] = useState<File | undefined>(undefined);
    const [search, setSearch] = useState("");

    const handleAddBook = async () => {
        if (!title || !author) return;
        await bookStore.addBook({
            title,
            author,
            file,
            fileName: file ? file.name : undefined,
            fileUrl: file ? URL.createObjectURL(file) : undefined,
        });
        setTitle("");
        setAuthor("");
        setFile(undefined);
        const fileInput = document.getElementById("book-file") as HTMLInputElement;
        if (fileInput) fileInput.value = "";
    };

    const filteredBooks = bookStore.books.filter(
        (book) =>
            (book.title?.toLowerCase() || "").includes(search.toLowerCase()) ||
            (book.author?.toLowerCase() || "").includes(search.toLowerCase())
    );

    return (
        <Flex direction="column" className={styles.wrapper} gap="8">
            <Text variant="header-1">📚 Коллекция книг</Text>

            <Flex justifyContent="space-between" alignItems="center" gap="4">
                <TextInput
                    placeholder="Поиск по названию или автору..."
                    size="xl"
                    value={search}
                    style={{ flex: 1, minWidth: "400px" }}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <Button
                    size="xl"
                    width="auto"
                    disabled={!title || !author || bookStore.isLoading}
                    onClick={handleAddBook}
                    style={{ flexShrink: 0 }}
                >
                    Добавить книгу
                </Button>
            </Flex>
            <Flex alignItems="center" gap="4" wrap>
                <TextInput
                    label="Название книги"
                    placeholder="Введите название"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    size="xl"
                    style={{ flex: 1 }}
                />
                <TextInput
                    label="Автор"
                    placeholder="Введите автора"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    size="xl"
                    style={{ flex: 1 }}
                />
                <input
                    id="book-file"
                    type="file"
                    accept=".pdf,.txt,.docx"
                    onChange={(e) => {
                        const selected = e.target.files?.[0] ?? undefined;
                        setFile(selected);
                    }}
                    style={{ display: "none" }}
                />

                <Button
                    size="l"
                    variant="outlined"
                    onClick={() => {
                        const fileInput = document.getElementById("book-file") as HTMLInputElement;
                        fileInput?.click();
                    }}
                >
                    {file ? file.name : "📄 Прикрепить файл"}
                </Button>

            </Flex>

            <Flex direction="column" gap="4" className={styles.bookList}>
                {filteredBooks.length === 0 ? (
                    <Text variant="body-2" color="secondary">
                        Книги не найдены.
                    </Text>
                ) : (
                    filteredBooks.map((book, index) => (
                        <Card key={book._id || book.bookId || index} className={styles.bookCard}>
                            <Flex direction="column" gap="1">
                                <Text variant="header-2">{book.title || "Без названия"}</Text>
                                <Text variant="body-2" color="secondary">
                                    Автор: {book.author || "Неизвестен"}
                                </Text>
                                {book.fileName && (
                                    <Button
                                        view="outlined"
                                        size="m"
                                        width="max"
                                        onClick={() => {
                                            if (book.fileUrl)
                                                window.open(book.fileUrl);
                                        }}
                                    >
                                        Открыть файл ({book.fileName})
                                    </Button>
                                )}
                            </Flex>
                        </Card>
                    ))
                )}
            </Flex>
        </Flex>
    );
});