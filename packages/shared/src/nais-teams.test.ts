import { NaisTeams, User, lookupUserQuery } from "./nais-teams";

describe("NaisTeams", () => {
  const teamsUrl = "https://example.com/teams";
  const teamsToken = "my-token";
  const allowedTeams = ["team-a", "team-b"];
  const naisTeams = new NaisTeams(teamsUrl, teamsToken, allowedTeams);

  describe("lookupUser", () => {
    it("should return user object when user is found", async () => {
      const email = "user@example.com";
      const expectedUser: User = {
        name: "John Doe",
        email: "user@example.com",
        teams: {
          nodes: [
            {
              role: "admin",
              team: {
                slug: "team-a",
              },
            },
          ],
          pageInfo: {
            hasNextPage: false,
          },
        },
      };
      const mockResponse = {
        data: {
          user: expectedUser,
        },
      };
      jest.spyOn(global, "fetch").mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue(mockResponse),
      } as any);

      const user = await naisTeams.lookupUser(email);

      expect(user).toEqual(expectedUser);
      expect(global.fetch).toHaveBeenCalledWith(teamsUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${teamsToken}`,
        },
        body: JSON.stringify({
          query: lookupUserQuery,
          variables: {
            email,
          },
        }),
      });
    });

    it("should return null when user is not found", async () => {
      const email = "non-existent-user@example.com";
      const mockResponse = {
        data: {
          user: null,
        },
      };
      jest.spyOn(global, "fetch").mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue(mockResponse),
      } as any);

      const user = await naisTeams.lookupUser(email);

      expect(user).toBeNull();
      expect(global.fetch).toHaveBeenCalledWith(teamsUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${teamsToken}`,
        },
        body: JSON.stringify({
          query: lookupUserQuery,
          variables: {
            email,
          },
        }),
      });
    });

    it("should throw an error when response contains errors", async () => {
      const email = "user@example.com";
      const mockResponse = {
        errors: [
          {
            message: "Something went wrong",
          },
        ],
      };
      jest.spyOn(global, "fetch").mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue(mockResponse),
      } as any);

      await expect(naisTeams.lookupUser(email)).rejects.toThrow(
        mockResponse.errors[0].message,
      );
    });
  });

  describe("authorize", () => {
    it("should return status true and user object when user is authorized", async () => {
      const email = "user@example.com";
      const expectedUser: User = {
        name: "John Doe",
        email: "user@example.com",
        teams: {
          nodes: [
            {
              role: "admin",
              team: {
                slug: "team-a",
              },
            },
          ],
          pageInfo: { hasNextPage: false },
        },
      };
      const mockResponse = {
        data: {
          user: expectedUser,
        },
      };
      jest.spyOn(global, "fetch").mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue(mockResponse),
      } as any);

      const result = await naisTeams.authorize(email);

      expect(result).toEqual({ status: true, user: expectedUser });
      expect(global.fetch).toHaveBeenCalledWith(teamsUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${teamsToken}`,
        },
        body: JSON.stringify({
          query: lookupUserQuery,
          variables: {
            email,
          },
        }),
      });
    });

    it("should return status false and null user when user is not found", async () => {
      const email = "non-existent-user@example.com";
      const mockResponse = {
        data: {
          user: null,
        },
      };
      jest.spyOn(global, "fetch").mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue(mockResponse),
      } as any);

      const result = await naisTeams.authorize(email);

      expect(result).toEqual({ status: false, user: null });
      expect(global.fetch).toHaveBeenCalledWith(teamsUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${teamsToken}`,
        },
        body: JSON.stringify({
          query: lookupUserQuery,
          variables: {
            email,
          },
        }),
      });
    });

    it("should return status false and null user when user is not in allowed teams", async () => {
      const email = "user@example.com";
      const user: User = {
        name: "John Doe",
        email: "user@example.com",
        teams: {
          nodes: [
            {
              role: "admin",
              team: {
                slug: "team-c",
              },
            },
          ],
          pageInfo: { hasNextPage: false },
        },
      };
      const mockResponse = {
        data: {
          user: user,
        },
      };
      jest.spyOn(global, "fetch").mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue(mockResponse),
      } as any);

      const result = await naisTeams.authorize(email);

      expect(result).toEqual({ status: false, user });
      expect(global.fetch).toHaveBeenCalledWith(teamsUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${teamsToken}`,
        },
        body: JSON.stringify({
          query: lookupUserQuery,
          variables: {
            email,
          },
        }),
      });
    });

    it("should return status false and null user when lookupUser throws an error", async () => {
      const email = "user@example.com";
      jest
        .spyOn(naisTeams, "lookupUser")
        .mockRejectedValue(new Error("Something went wrong"));

      const result = await naisTeams.authorize(email);

      expect(result).toEqual({ status: false, user: null });
    });
  });
});
