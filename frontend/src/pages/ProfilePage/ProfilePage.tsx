import { observer } from "mobx-react";
import { userStore } from "../../store";

export const ProfilePage: React.FC = observer(() => {
    const { user } = userStore;

    return <div>Profile Page for user {user}</div>;
});
