import { flow, types } from "mobx-state-tree";
import { State } from "../common/State";
import { authLogin, myself, register } from "../../api/fetchers";

export const UserStore = types
    .model("UserStore", {
        login: types.maybeNull(types.string),
        state: State,
    })
    .actions((self) => ({
        authLogin: flow(function* (login: string, password: string) {
            self.state = "loading";

            try {
                yield authLogin({ login, password });

                self.login = login;
                self.state = "success";
            } catch (error) {
                self.state = "error";
            }
        }),
        register: flow(function* (login: string, password: string) {
            self.state = "loading";
            try {
                yield register({ login, password });
                self.state = "success";
            } catch (error) {
                self.state = "error";
            }
        }),
        myself: flow(function* () {
            self.state = "loading";
            try {
                const response = yield myself();
                self.login = response.login;
                self.state = "success";
            } catch (error) {
                self.state = "error";
            }
        }),
    }));
