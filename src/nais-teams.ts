export interface TeamsService {
  authorize: (user: string) => Promise<{ status: boolean; user: User | null }>;
}

export type User = {
  name: string;
  email: string;
  teams: {
    role: string;
    team: {
      slug: string;
    };
  }[];
};

export const lookupUserQuery = `query LookupUser($email: String!) {
  userByEmail(email:$email) {
    name,
    email,
    teams {
      role,
      team {
        slug,
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

    const json: any = await response.json();

    if (json.errors) {
      throw new Error(json.errors[0].message);
    }

    return json.data.userByEmail;
  };

  /**
   * Authorizes a user by email and returns a status and user object.
   * @param email - The email of the user to authorize.
   * @returns A Promise that resolves to an object containing a status and user object.
   */
  authorize = async (
    email: string
  ): Promise<{ status: boolean; user: User | null }> => {
    let userByEmail: User | null = null;

    try {
      userByEmail = await this.lookupUser(email);
    } catch (error) {
      return { status: false, user: userByEmail };
    }

    if (!userByEmail) {
      return { status: false, user: userByEmail };
    }

    const { teams } = userByEmail;

    if (!teams) {
      return { status: false, user: userByEmail };
    }

    const allowedTeams = teams.filter((team: any) =>
      this.allowedTeams.includes(team.team.slug)
    );

    if (allowedTeams.length === 0) {
      return { status: false, user: userByEmail };
    }

    return { status: true, user: userByEmail };
  };
}
