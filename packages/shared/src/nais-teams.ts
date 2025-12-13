import { getLogger } from "log4js";
export interface TeamsService {
  authorize: (user: string) => Promise<{ status: boolean; user: User | null }>;
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

export const lookupUserQuery = `query LookupUser($email: String!) {
  user(email: $email) {
    name
    email
    teams(first: 100) {
      nodes {
        role
        team {
          slug
        }
      }
      pageInfo {
        hasNextPage
      }
    }
  }
}`;

/**
 * Represents a class that handles authorization for NAIS teams.
 */
export class NaisTeams {
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
  constructor(teamsUrl: string, teamsToken: string, allowedTeams: string[]) {
    this.teamsUrl = teamsUrl;
    this.teamsToken = teamsToken;
    this.allowedTeams = allowedTeams;
  }

  /**
   * Looks up a user by email and returns their name and teams with roles and slugs.
   * @param {string} email - The email of the user to lookup.
   * @returns {Promise<any | null>} - A promise that resolves to the user object or null if not found.
   * @throws {Error} - If the response contains errors.
   */
  lookupUser = async (email: string): Promise<User | null> => {
    const logger = getLogger("nais/nais-teams.ts");

    const response = await fetch(this.teamsUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.teamsToken}`,
      },
      body: JSON.stringify({
        query: lookupUserQuery,
        variables: {
          email: email,
        },
      }),
    });

    logger.debug("lookupUser: response status", response.status);
    logger.debug("lookupUser: response headers", response.headers);

    const json: { data: { user: User }; errors: any[] } = await response.json();

    if (json.errors) {
      logger.error("lookupUser: json errors", json.errors);
      throw new Error(json.errors[0].message);
    }

    if (json.data.user?.teams.pageInfo.hasNextPage) {
      logger.error(
        "lookupUser: user has more than 100 teams, pagination not implemented",
      );
    }

    logger.info("lookupUser: user found");
    logger.debug("lookupUser: response", json);

    return json.data.user;
  };

  /**
   * Authorizes a user by email and returns a status and user object.
   * @param email - The email of the user to authorize.
   * @returns A Promise that resolves to an object containing a status and user object.
   */
  authorize = async (
    email: string,
  ): Promise<{ status: boolean; user: User | null }> => {
    const logger = getLogger("nais/nais-teams.ts");

    let userByEmail: User | null = null;

    logger.debug("authorize: config", {
      teamsUrl: this.teamsUrl,
      allowedTeams: this.allowedTeams,
    });

    logger.info("authorize: user", email);

    try {
      userByEmail = await this.lookupUser(email);
    } catch (error) {
      logger.warn("authorize: error looking up user", error);
      return { status: false, user: userByEmail };
    }

    if (!userByEmail) {
      logger.warn("authorize: user not found", email);
      return { status: false, user: userByEmail };
    }

    logger.info("authorize: user found", userByEmail);
    const {
      teams: { nodes: teams },
    } = userByEmail;

    if (!teams) {
      logger.warn("authorize: user has no teams", userByEmail);
      return { status: false, user: userByEmail };
    }

    const allowedTeams = teams.filter((team: any) =>
      this.allowedTeams.includes(team.team.slug),
    );

    logger.debug("authorize: allowed user teams", allowedTeams);

    if (allowedTeams.length === 0) {
      logger.warn("authorize: user has no allowed teams", userByEmail);
      return { status: false, user: userByEmail };
    }

    logger.info("authorize: user authorized", userByEmail);
    return { status: true, user: userByEmail };
  };
}
