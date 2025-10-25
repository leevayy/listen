import type { LoginRequest, LoginResponse, MyselfResponse } from "./types";

const API_BASE_URL = 'http://62.84.120.166/api/';

export type RequestParams = {
    body: Record<string, any>;
    query: Record<string, any>;
    method: 'POST' | 'GET' | 'PUT' | 'DELETE';
}

const sessionId = localStorage.getItem('sessionId') || '';

class InternalError {
    status: number;

    constructor(status: number) {
        this.status = status;
    }
}

const fetchApi = async (endpoint: string, requestParams: RequestParams) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: requestParams.method,
        headers: {
            'Content-Type': 'application/json',
            'X-Session-Id': sessionId,
        },
        body: JSON.stringify(requestParams.body),
    });

    if (!response.ok) {
        throw new InternalError(response.status);
    }

    const json = await response.json();

    return json;
};

export const authLogin = async (params: LoginRequest) => {
    const response: LoginResponse = await fetchApi('login', {
        body: params,
        query: {},
        method: 'POST',
    });

    localStorage.setItem('sessionId', response.sessionId);

    return response;
};

export const register = async (params: LoginRequest) => {
    const response: LoginResponse = await fetchApi('register', {
        body: params,
        query: {},
        method: 'POST',
    });

    localStorage.setItem('sessionId', response.sessionId);

    return response;
};

export const myself = async () => {
    const response: MyselfResponse = await fetchApi('myself', {
        body: {},
        query: {},
        method: 'GET',
    });
    
    return response;
};
