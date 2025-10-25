import {
    Button,
    Flex,
    PasswordInput,
    Text,
    TextInput,
} from "@gravity-ui/uikit";
import styles from "./AuthForm.module.css";
import { useState } from "react";
import { observer } from "mobx-react";
import { userStore } from "../../store";
import { useNavigate } from "react-router";
import { pages } from "../../pages/pages";

type Props = {};

export const AuthForm: React.FC<Props> = observer(() => {
    const [login, setLogin] = useState("");
    const [password, setPassword] = useState("");

    const navigate = useNavigate();

    return (
        <Flex direction="column" className={styles.wrapper} gap="8">
            <Text variant="header-1">Войдите</Text>
            <Flex direction="column" gap="4">
                <TextInput
                    label="Логин"
                    placeholder="Введите ваш логин"
                    onChange={(event) => setLogin(event.target.value)}
                    size="xl"
                />
                <PasswordInput
                    label="Пароль"
                    placeholder="Введите ваш пароль"
                    onChange={(event) => setPassword(event.target.value)}
                    size="xl"
                />
                <Flex justifyContent="center" gap="2">
                    <Button
                        size="xl"
                        width="max"
                        disabled={
                            !login || !password || userStore.state === "loading"
                        }
                        onClick={async () => {
                            await userStore.authLogin(login, password);
                            
                            if (userStore.state === 'success') {
                                navigate(pages.profile);
                            }
                        }}
                    >
                        Войти
                    </Button>
                    <Button
                        size="xl"
                        width="max"
                        disabled={
                            !login || !password || userStore.state === "loading"
                        }
                        onClick={async () => {
                            await userStore.register(login, password);

                            if (userStore.state === 'success') {
                                navigate(pages.profile);
                            }
                        }}
                    >
                        Зарегистрироваться
                    </Button>
                </Flex>
            </Flex>
        </Flex>
    );
});
