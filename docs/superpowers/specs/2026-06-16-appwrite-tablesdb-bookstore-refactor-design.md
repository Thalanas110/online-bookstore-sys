# Appwrite TablesDB Refactor Design

## Goal

Replace the Appwrite Function's external MongoDB dependency with Appwrite Databases / TablesDB while preserving the existing HTTP API, auth flow, and AES-256-GCM handling.

## Scope

- Keep all `/api/...` endpoints and response shapes stable.
- Keep Appwrite JWT-based auth and admin checks stable.
- Keep AES-256-GCM encryption for profile addresses and shipping addresses.
- Replace only backend persistence and setup/docs from MongoDB to TablesDB.

## Storage Model

- One Appwrite database identified by `APPWRITE_DATABASE_ID`
- `books` table identified by `APPWRITE_BOOKS_TABLE_ID`
- `orders` table identified by `APPWRITE_ORDERS_TABLE_ID`
- `profiles` table identified by `APPWRITE_PROFILES_TABLE_ID`

Rows will continue to use the existing application IDs so the API contract remains unchanged.

## Repository Strategy

- `books` repository maps list/get/create/update/delete and stock reservation onto TablesDB row operations.
- `orders` repository maps create/get/list/update status onto TablesDB row operations.
- `profiles` repository maps upsert/get/list onto TablesDB row operations.

Search and filtering will be implemented with Appwrite query helpers where possible, with conservative in-memory filtering only if needed to preserve current API behavior.

## Config Changes

Remove:

- `MONGODB_URI`
- `MONGODB_DB_NAME`

Add:

- `APPWRITE_DATABASE_ID`
- `APPWRITE_BOOKS_TABLE_ID`
- `APPWRITE_ORDERS_TABLE_ID`
- `APPWRITE_PROFILES_TABLE_ID`

## Verification

- Update config tests first to require Appwrite database/table IDs instead of Mongo settings.
- Run the existing function test suite after each refactor pass.
- Update docs and env templates to remove MongoDB setup language.
