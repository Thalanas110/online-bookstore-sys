import { Account, Client, ID, Users } from 'node-appwrite';

import { HttpError } from './errors.js';

function createBaseClient(config) {
  return new Client()
    .setEndpoint(config.appwriteEndpoint)
    .setProject(config.appwriteProjectId);
}

function toHttpError(error, fallbackStatus, fallbackType, fallbackMessage) {
  if (error instanceof HttpError) {
    return error;
  }

  const statusCode = Number(error?.code);
  const message = error?.message || fallbackMessage;

  switch (statusCode) {
    case 400:
      return new HttpError(400, 'bad_request', message);
    case 401:
      return new HttpError(401, 'unauthorized', message);
    case 403:
      return new HttpError(403, 'forbidden', message);
    case 404:
      return new HttpError(404, 'not_found', message);
    case 409:
      return new HttpError(409, 'conflict', message);
    default:
      return new HttpError(fallbackStatus, fallbackType, message);
  }
}

export function createAppwriteService(config) {
  const adminClient = createBaseClient(config).setKey(config.appwriteApiKey);
  const adminUsers = new Users(adminClient);

  return {
    async createUser({ email, password, name }) {
      try {
        return await adminUsers.create({
          userId: ID.unique(),
          email,
          password,
          name,
        });
      } catch (error) {
        throw toHttpError(error, 500, 'appwrite_error', 'Failed to create Appwrite user');
      }
    },

    async createEmailPasswordSession({ email, password }) {
      try {
        const account = new Account(createBaseClient(config));
        return await account.createEmailPasswordSession({
          email,
          password,
        });
      } catch (error) {
        throw toHttpError(error, 401, 'unauthorized', 'Invalid email or password');
      }
    },

    async getUserFromSessionSecret({ sessionSecret }) {
      try {
        const client = createBaseClient(config).setSession(sessionSecret);
        const account = new Account(client);
        return await account.get();
      } catch (error) {
        throw toHttpError(error, 401, 'unauthorized', 'Invalid session secret');
      }
    },

    async getUserFromJwt({ jwt }) {
      try {
        const client = createBaseClient(config).setJWT(jwt);
        const account = new Account(client);
        return await account.get();
      } catch (error) {
        throw toHttpError(error, 401, 'unauthorized', 'Invalid or expired authentication token');
      }
    },

    async updateUserName({ jwt, name }) {
      try {
        const client = createBaseClient(config).setJWT(jwt);
        const account = new Account(client);
        return await account.updateName({ name });
      } catch (error) {
        throw toHttpError(error, 400, 'bad_request', 'Failed to update user name');
      }
    },

    async updatePassword({ jwt, oldPassword, newPassword }) {
      try {
        const client = createBaseClient(config).setJWT(jwt);
        const account = new Account(client);
        await account.updatePassword({
          password: newPassword,
          oldPassword,
        });
      } catch (error) {
        throw toHttpError(error, 400, 'bad_request', 'Failed to update password');
      }
    },

    async deleteCurrentSession({ jwt }) {
      try {
        const client = createBaseClient(config).setJWT(jwt);
        const account = new Account(client);
        await account.deleteSession({ sessionId: 'current' });
      } catch (error) {
        throw toHttpError(error, 400, 'bad_request', 'Failed to delete current session');
      }
    },

    async listUsers() {
      try {
        const result = await adminUsers.list({});
        return Array.isArray(result?.users) ? result.users : [];
      } catch (error) {
        throw toHttpError(error, 500, 'appwrite_error', 'Failed to list users');
      }
    },
  };
}
