import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import { getLogger } from "log4js";
import * as path from "path";
import type { TeamsService, User } from "./nais-teams";

const PROTO_DIR = path.resolve(__dirname, "../../proto");

/**
 * gRPC-based teams service that talks to nais/api instead of the
 * deprecated console GraphQL endpoint.
 *
 * Implements the same TeamsService interface as NaisTeams so it can be
 * used as a drop-in replacement.
 */
export class NaisTeamsGrpc implements TeamsService {
  private teamsClient: any;
  private usersClient: any;
  private allowedTeams: string[];

  constructor(apiAddress: string, allowedTeams: string[]) {
    const logger = getLogger("nais/nais-teams-grpc.ts");

    const packageDefinition = protoLoader.loadSync(
      [path.join(PROTO_DIR, "teams.proto"), path.join(PROTO_DIR, "users.proto")],
      {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
        includeDirs: [PROTO_DIR],
      },
    );

    const proto = grpc.loadPackageDefinition(packageDefinition) as any;
    const credentials = grpc.credentials.createInsecure();

    this.teamsClient = new proto.nais.api.protobuf.Teams(apiAddress, credentials);
    this.usersClient = new proto.nais.api.protobuf.Users(apiAddress, credentials);
    this.allowedTeams = allowedTeams;

    logger.info(`NaisTeamsGrpc: connected to nais/api at ${apiAddress}`);
  }

  /**
   * Authorizes a user by looking up their team memberships via gRPC
   * and checking against the allowed teams list.
   */
  authorize = async (
    email: string,
  ): Promise<{ status: boolean; user: User | null }> => {
    const logger = getLogger("nais/nais-teams-grpc.ts");

    logger.debug("authorize: config", { allowedTeams: this.allowedTeams });
    logger.info("authorize: user", email);

    try {
      const [name, teams] = await Promise.all([
        this.getUserName(email),
        this.listTeamsForUser(email),
      ]);

      const user = buildUser(email, name, teams);

      const allowedTeams = teams.filter((slug) =>
        this.allowedTeams.includes(slug),
      );

      if (allowedTeams.length === 0) {
        logger.warn("authorize: user has no allowed teams", email);
        return { status: false, user };
      }

      logger.info("authorize: user authorized", email);
      return { status: true, user };
    } catch (error) {
      logger.warn("authorize: error looking up user", error);
      return { status: false, user: null };
    }
  };

  private getUserName(email: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.usersClient.Get(
        { email },
        (err: grpc.ServiceError | null, response: any) => {
          if (err) return reject(err);
          resolve(response?.user?.name || "");
        },
      );
    });
  }

  private listTeamsForUser(email: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      this.teamsClient.ListForUserByEmail(
        { email, limit: 100, offset: 0 },
        (err: grpc.ServiceError | null, response: any) => {
          if (err) return reject(err);
          const slugs = (response?.nodes || []).map(
            (t: any) => t.slug,
          );
          resolve(slugs);
        },
      );
    });
  }
}

function buildUser(email: string, name: string, teams: string[]): User {
  return {
    name,
    email,
    teams: {
      nodes: teams.map((slug) => ({
        role: "",
        team: { slug },
      })),
      pageInfo: { hasNextPage: false },
    },
  };
}
