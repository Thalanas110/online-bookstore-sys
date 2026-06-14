import { toPublicUser } from '../mappers.js';
import { validatePasswordChange, validateProfileUpdate } from '../validators.js';

function decryptAddress(services, addressEncrypted) {
  if (!addressEncrypted) {
    return undefined;
  }

  return services.crypto.decrypt(JSON.parse(addressEncrypted));
}

export function createUserHandlers(services) {
  return {
    async getProfile({ auth }) {
      const profile = await services.profiles.getByUserId(auth.user.$id);
      const address = decryptAddress(services, profile?.addressEncrypted);

      return {
        statusCode: 200,
        noStore: true,
        body: toPublicUser(auth.user, profile, address),
      };
    },

    async updateProfile({ auth, request }) {
      const payload = validateProfileUpdate(request.bodyJson);
      const currentProfile = await services.profiles.getByUserId(auth.user.$id);

      const updatedUser = payload.name
        ? await services.appwrite.updateUserName({
            jwt: auth.jwt,
            name: payload.name,
            userAgent: request.headers?.['user-agent'] ?? '',
          })
        : auth.user;

      const addressEncrypted = payload.address
        ? services.crypto.serialize(services.crypto.encrypt(payload.address))
        : currentProfile?.addressEncrypted;

      const profile = await services.profiles.upsert({
        userId: auth.user.$id,
        phone: payload.phone ?? currentProfile?.phone,
        addressEncrypted,
        updatedAt: services.clock.nowIso(),
      });

      return {
        statusCode: 200,
        noStore: true,
        body: toPublicUser(updatedUser, profile, decryptAddress(services, profile.addressEncrypted)),
      };
    },

    async changePassword({ auth, request }) {
      const payload = validatePasswordChange(request.bodyJson);

      await services.appwrite.updatePassword({
        jwt: auth.jwt,
        oldPassword: payload.oldPassword,
        newPassword: payload.newPassword,
        userAgent: request.headers?.['user-agent'] ?? '',
      });

      return {
        statusCode: 204,
        noStore: true,
      };
    },
  };
}
