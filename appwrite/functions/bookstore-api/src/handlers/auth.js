import { HttpError } from '../errors.js';
import { toPublicUser } from '../mappers.js';
import { validateLogin, validateRegistration } from '../validators.js';

export function createAuthHandlers(services) {
  return {
    async register({ request }) {
      const payload = validateRegistration(request.bodyJson);
      const appwriteUser = await services.appwrite.createUser(payload);

      return {
        statusCode: 201,
        noStore: true,
        body: toPublicUser(appwriteUser),
      };
    },

    async login({ request }) {
      const payload = validateLogin(request.bodyJson);
      const session = await services.appwrite.createEmailPasswordSession({
        ...payload,
        userAgent: request.headers?.['user-agent'] ?? '',
      });
      const appwriteUser = await services.appwrite.getUserFromSessionSecret({
        sessionSecret: session.secret,
        userAgent: request.headers?.['user-agent'] ?? '',
      });

      return {
        statusCode: 200,
        noStore: true,
        body: {
          user: toPublicUser(appwriteUser),
          session: {
            secret: session.secret,
            expire: session.expire,
          },
        },
      };
    },

    async logout({ auth, request }) {
      await services.appwrite.deleteCurrentSession({
        jwt: auth.jwt,
        userAgent: request.headers?.['user-agent'] ?? '',
      });

      return {
        statusCode: 204,
        noStore: true,
      };
    },

    async me({ auth, request }) {
      const profile = await services.profiles.getByUserId(auth.user.$id);
      const address = profile?.addressEncrypted
        ? services.crypto.decrypt(JSON.parse(profile.addressEncrypted))
        : undefined;

      return {
        statusCode: 200,
        noStore: true,
        body: toPublicUser(auth.user, profile, address),
      };
    },
  };
}
