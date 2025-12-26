import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./App/App.tsx";
import "@gravity-ui/uikit/styles/fonts.css";
import "@gravity-ui/uikit/styles/styles.css";
import { createBrowserRouter, RouterProvider } from "react-router";
import { ThemeProvider } from "@gravity-ui/uikit";
import { ProfilePage } from "./pages/ProfilePage/ProfilePage.tsx";
import { AuthPage } from "./pages/AuthPage/AuthPage.tsx";
import { CollectPage} from "./pages/CollectPage/CollectPage.tsx";
import { BookPage } from "./pages/BookPage/BookPage.tsx";

const router = createBrowserRouter([
    {
        path: "/",
        element: <App />,
        children: [
            {
                path: "/auth",
                element: <AuthPage />,
            },
            {
                path: "/profile",
                element: <ProfilePage />,
            },
            {
                path: "/collection",
                element: <CollectPage />
            },
            {
                path: "/book",
                element: <BookPage />
            },
            {
                path: "/profile",
                element: <ProfilePage />
            }
        ]
    },
]);

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <ThemeProvider theme="dark">
            <RouterProvider router={router}></RouterProvider>
        </ThemeProvider>
    </StrictMode>
);
