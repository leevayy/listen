export type User = {
    login: string;
}

export type AuthResponse = {
    sessionId: string;
}

export type LoginRequest = {
    login: string;
    password: string;
}

export type LoginResponse = AuthResponse;

export type RegisterRequest = {
    login: string;
    password: string;
}

export type RegisterResponse = AuthResponse;

export type MyselfResponse = User;
