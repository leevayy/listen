import { Button, Flex } from "@gravity-ui/uikit";
import { useLocation } from "react-router";
import { pages } from "../../pages/pages";

type Props = {};

export const NavigationFooter: React.FC<Props> = () => {
    const location = useLocation();

    return (
        <Flex justifyContent="space-between">
            <Button
                view={
                    location.pathname === pages.collection
                        ? "flat-action"
                        : "flat"
                }
                width="max"
                size="xl"
            >
                Collection
            </Button>
            <Button
                view={location.pathname === pages.book ? "flat-action" : "flat"}
                width="max"
                size="xl"
            >
                Book
            </Button>
            <Button
                view={
                    location.pathname === pages.profile ? "flat-action" : "flat"
                }
                width="max"
                size="xl"
            >
                Profile
            </Button>
        </Flex>
    );
};
