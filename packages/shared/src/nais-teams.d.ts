export interface TeamsService {
    authorize: (user: string) => Promise<{
        status: boolean;
        user: User | null;
    }>;
}
export type User = {
    name: string;
    email: string;
    teams: {
        nodes: {
            role: string;
            team: {
                slug: string;
            };
        }[];
        pageInfo: {
            hasNextPage: boolean;
        };
    };
};
export declare const lookupUserQuery = "query LookupUser($email: String!) {\n  user(email: $email) {\n    name\n    email\n    teams(first: 100) {\n      nodes {\n        role\n        team {\n          slug\n        }\n      }\n      pageInfo {\n        hasNextPage\n      }\n    }\n  }\n}";
/**
 * Represents a class that handles authorization for NAIS teams.
 */
export declare class NaisTeams {
    /**
     * The URL of the NAIS teams API.
     */
    teamsUrl: string;
    /**
     * The token used to authenticate with the NAIS teams API.
     */
    teamsToken: string;
    /**
     * An array of allowed team slugs.
     */
    allowedTeams: string[];
    /**
     * Creates a new instance of the NaisTeams class.
     * @param {string} teamsUrl - The URL of the NAIS teams API.
     * @param {string} teamsToken - The token used to authenticate with the NAIS teams API.
     * @param {string[]} allowedTeams - An array of allowed team slugs.
     */
    constructor(teamsUrl: string, teamsToken: string, allowedTeams: string[]);
    /**
     * Looks up a user by email and returns their name and teams with roles and slugs.
     * @param {string} email - The email of the user to lookup.
     * @returns {Promise<any | null>} - A promise that resolves to the user object or null if not found.
     * @throws {Error} - If the response contains errors.
     */
    lookupUser: (email: string) => Promise<User | null>;
    /**
     * Authorizes a user by email and returns a status and user object.
     * @param email - The email of the user to authorize.
     * @returns A Promise that resolves to an object containing a status and user object.
     */
    authorize: (email: string) => Promise<{
        status: boolean;
        user: User | null;
    }>;
}
