import { Flex } from "@gravity-ui/uikit";
import { Outlet, useLocation, useNavigate } from "react-router";
import { NavigationFooter } from "../components/NavigationFooter/NavigationFooter";
import { observer } from "mobx-react";
import styles from "./App.module.css";
import { userStore } from "../store";
import { pages } from "../pages/pages";
import { useEffect } from "react";

export const App: React.FC = observer(() => {
    const { authLogin: login } = userStore;
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const login = async () => {
            await userStore.myself();

            if (!login) {
                navigate(pages.auth);
            }

            if (userStore.state === "intial") {
                login();
            }
        };
    }, [login]);

    return (
        <Flex direction="column" className={styles.wrapper}>
            <div className={styles.content}>
                <Outlet />
            </div>
            {location.pathname !== pages.auth && <NavigationFooter />}
        </Flex>
    );
});
