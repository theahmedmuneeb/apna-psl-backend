import axios, { type AxiosRequestConfig, type Method } from "axios";
import { env } from "@/env";
import {
    type SportmonksFixture,
    type SportmonksPlayer,
    type SportmonksResponse,
} from "@/lib/sportmonks/types";

const client = axios.create({
    baseURL: "https://cricket.sportmonks.com/api/v2.0",
    params: {
        api_token: env.SPORTMONKS_API_TOKEN,
        "filter[league_id]": env.SPORTMONKS_PSL_LEAGUE_ID,
        "filter[season_id]": env.SPORTMONKS_PSL_SEASON_ID,
        include: "localteam,visitorteam,venue",
    },
    headers: {
        "Content-Type": "application/json",
    },
});

type SportmonksError = {
    message?: string;
    errors?: any;
};

const request = async <T>(
    method: Method,
    url: string,
    configOverride?: AxiosRequestConfig,
    mergeDefaultParams = true,
): Promise<SportmonksResponse<T>> => {
    try {
        const defaultParams = mergeDefaultParams
            ? ((client.defaults.params as Record<string, unknown>) ?? {})
            : {};
        const overrideParams = (configOverride?.params as Record<string, unknown>) ?? {};

        const res = await client.request<SportmonksResponse<T>>({
            method,
            url,
            ...configOverride,
            params: {
                ...defaultParams,
                ...overrideParams,
            },
        });

        return res.data;
    } catch (err: unknown) {
        const e = err as {
            response?: {
                status: number;
                data?: SportmonksError;
            };
            message?: string;
        };

        throw {
            status: e.response?.status ?? 500,
            message:
                e.response?.data?.message ||
                e.response?.data?.errors ||
                e.message ||
                "Request failed",
            raw: e.response?.data ?? null,
        };
    }
};

export const psl = {
    fixtures: (configOverride?: AxiosRequestConfig) =>
        request<SportmonksFixture[]>("get", "/fixtures", configOverride),

    fixturesByDate: (
        date: string,
        configOverride?: AxiosRequestConfig,
    ) =>
        request<SportmonksFixture[]>("get", `/fixtures/date/${date}`, configOverride),

    fixtureById: (fixtureId: number, configOverride?: AxiosRequestConfig) =>
        request<SportmonksFixture>("get", `/fixtures/${fixtureId}`, configOverride),

    fixtureByIdDetailed: (fixtureId: number, configOverride?: AxiosRequestConfig) =>
        request<SportmonksFixture>("get", `/fixtures/${fixtureId}`, {
            params: {
                include:
                    "localteam,visitorteam,venue,runs,balls,balls.batsman,balls.bowler,balls.score,batting.batsman,bowling.bowler,lineup,tosswon",
            },
            ...configOverride,
        }),

    playerById: async (playerId: number, configOverride?: AxiosRequestConfig) => {
        try {
            const response = await axios.get<SportmonksResponse<SportmonksPlayer>>(
                `https://cricket.sportmonks.com/api/v2.0/players/${playerId}`,
                {
                    params: {
                        api_token: env.SPORTMONKS_API_TOKEN,
                        include: "country",
                        ...(configOverride?.params as Record<string, unknown> | undefined),
                    },
                    headers: {
                        "Content-Type": "application/json",
                        ...(configOverride?.headers as Record<string, string> | undefined),
                    },
                },
            );

            return response.data;
        } catch (err: unknown) {
            const e = err as {
                response?: {
                    status: number;
                    data?: SportmonksError;
                };
                message?: string;
            };

            throw {
                status: e.response?.status ?? 500,
                message:
                    e.response?.data?.message ||
                    e.response?.data?.errors ||
                    e.message ||
                    "Request failed",
                raw: e.response?.data ?? null,
            };
        }
    },
};