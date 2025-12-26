import { Button, Flex } from "@gravity-ui/uikit";
import { useLocation, useNavigate } from "react-router";
import { pages } from "../../pages/pages";

type Props = {};

export const NavigationFooter: React.FC<Props> = () => {
    const location = useLocation();
    const navigate = useNavigate();

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
            onClick={()=> navigate(pages.collection)}
            >
                Collection
            </Button>
            <Button
                view={location.pathname === pages.book ? "flat-action" : "flat"}
                width="max"
                size="xl"
            onClick={()=> navigate(pages.book)}
            >
                Book
            </Button>
            <Button
                view={
                    location.pathname === pages.profile ? "flat-action" : "flat"
                }
                width="max"
                size="xl"
            onClick={()=> navigate(pages.profile)}
            >
                Profile
            </Button>
        </Flex>
    );
};
