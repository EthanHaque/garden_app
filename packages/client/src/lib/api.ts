type GetTokenFunction = () => string | null;
type RefreshTokenFunction = () => Promise<string | null>;

class ApiClient {
    private baseUrl: string;
    private getToken: GetTokenFunction;
    private refreshToken: RefreshTokenFunction;
    private isRefreshing = false;
    private failedQueue: Array<{ resolve: (value: unknown) => void; reject: (reason?: any) => void }> = [];

    constructor(baseUrl: string, getToken: GetTokenFunction, refreshToken: RefreshTokenFunction) {
        this.baseUrl = baseUrl;
        this.getToken = getToken;
        this.refreshToken = refreshToken;
    }

    private processQueue(error: any, token: string | null = null) {
        this.failedQueue.forEach((prom) => {
            if (error) {
                prom.reject(error);
            } else {
                prom.resolve(token);
            }
        });
        this.failedQueue = [];
    }

    public async fetch(url: string, options: RequestInit = {}): Promise<Response> {
        let token = this.getToken();
        const fullUrl = `${this.baseUrl}${url}`;

        const headers = new Headers(options.headers);
        if (token) {
            headers.set("Authorization", `Bearer ${token}`);
        }
        options.headers = headers;

        let response = await fetch(fullUrl, options);

        // If the token expired (401), try to refresh it
        if (response.status === 401) {
            if (!this.isRefreshing) {
                this.isRefreshing = true;
                try {
                    const newToken = await this.refreshToken();
                    if (!newToken) throw new Error("Failed to refresh token");

                    this.processQueue(null, newToken);
                    headers.set("Authorization", `Bearer ${newToken}`);
                    options.headers = headers;
                    // Retry the original request with the new token
                    response = await fetch(fullUrl, options);
                } catch (error) {
                    this.processQueue(error, null);
                    return Promise.reject(error);
                } finally {
                    this.isRefreshing = false;
                }
            } else {
                // If another request is already refreshing the token, wait for it to complete
                return new Promise((resolve, reject) => {
                    this.failedQueue.push({ resolve: () => resolve(this.fetch(url, options)), reject });
                });
            }
        }

        return response;
    }
}

export { ApiClient };
