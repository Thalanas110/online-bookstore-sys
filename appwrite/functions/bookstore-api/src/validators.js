import { HttpError } from './errors.js';

const ORDER_STATUSES = new Set(['pending', 'processing', 'shipped', 'completed', 'cancelled']);

function assertObject(value, label = 'Request body') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new HttpError(400, 'bad_request', `${label} must be a JSON object`);
  }

  return value;
}

function requireString(value, field, { min = 1 } = {}) {
  if (typeof value !== 'string' || value.trim().length < min) {
    throw new HttpError(400, 'bad_request', `${field} is required`);
  }

  return value.trim();
}

function optionalString(value) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  return String(value).trim();
}

function requireEmail(value) {
  const email = requireString(value, 'email');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HttpError(400, 'bad_request', 'email must be valid');
  }

  return email.toLowerCase();
}

function requirePassword(value, field = 'password') {
  const password = requireString(value, field, { min: 8 });
  if (password.length < 8) {
    throw new HttpError(400, 'bad_request', `${field} must be at least 8 characters`);
  }

  return password;
}

function requirePositiveInteger(value, field) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new HttpError(400, 'bad_request', `${field} must be a positive integer`);
  }

  return value;
}

function requireNonNegativeInteger(value, field) {
  if (!Number.isInteger(value) || value < 0) {
    throw new HttpError(400, 'bad_request', `${field} must be a non-negative integer`);
  }

  return value;
}

function requirePositiveNumber(value, field) {
  if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) {
    throw new HttpError(400, 'bad_request', `${field} must be a positive number`);
  }

  return value;
}

export function validateRegistration(body) {
  const input = assertObject(body);
  return {
    email: requireEmail(input.email),
    password: requirePassword(input.password),
    name: requireString(input.name, 'name'),
  };
}

export function validateLogin(body) {
  const input = assertObject(body);
  return {
    email: requireEmail(input.email),
    password: requirePassword(input.password),
  };
}

export function validateProfileUpdate(body) {
  const input = assertObject(body);

  return {
    name: optionalString(input.name),
    phone: optionalString(input.phone),
    address: optionalString(input.address),
  };
}

export function validatePasswordChange(body) {
  const input = assertObject(body);
  return {
    oldPassword: requirePassword(input.oldPassword, 'oldPassword'),
    newPassword: requirePassword(input.newPassword, 'newPassword'),
  };
}

export function validateOrderCreate(body) {
  const input = assertObject(body);
  const shippingAddress = requireString(input.shippingAddress, 'shippingAddress');

  if (!Array.isArray(input.items) || input.items.length === 0) {
    throw new HttpError(400, 'bad_request', 'items must contain at least one order item');
  }

  const items = input.items.map((item, index) => {
    const entry = assertObject(item, `items[${index}]`);
    return {
      bookId: requireString(entry.bookId, `items[${index}].bookId`),
      quantity: requirePositiveInteger(entry.quantity, `items[${index}].quantity`),
    };
  });

  return {
    items,
    shippingAddress,
  };
}

export function validateOrderStatusUpdate(body) {
  const input = assertObject(body);
  const status = requireString(input.status, 'status');

  if (!ORDER_STATUSES.has(status)) {
    throw new HttpError(400, 'bad_request', 'status must be a valid order status');
  }

  return { status };
}

export function validateUserScopedAccess(authUser, targetUserId, isAdmin) {
  if (isAdmin) {
    return;
  }

  if (authUser.$id !== targetUserId) {
    throw new HttpError(403, 'forbidden', 'You can only access your own orders');
  }
}

export function validateBookCreate(body) {
  const input = assertObject(body);

  return {
    title: requireString(input.title, 'title'),
    author: requireString(input.author, 'author'),
    isbn: requireString(input.isbn, 'isbn'),
    price: requirePositiveNumber(input.price, 'price'),
    stock: requireNonNegativeInteger(input.stock, 'stock'),
    description: requireString(input.description, 'description'),
    category: requireString(input.category, 'category'),
    publishedYear: requirePositiveInteger(input.publishedYear, 'publishedYear'),
    imageUrl: optionalString(input.imageUrl),
    rating: typeof input.rating === 'number' ? input.rating : 0,
    reviewCount: Number.isInteger(input.reviewCount) ? input.reviewCount : 0,
    isFeatured: Boolean(input.isFeatured),
    isBestseller: Boolean(input.isBestseller),
    isNew: Boolean(input.isNew),
    discount: typeof input.discount === 'number' ? input.discount : undefined,
  };
}

export function validateBookUpdate(body) {
  const input = assertObject(body);
  const updates = {};

  if ('title' in input) updates.title = requireString(input.title, 'title');
  if ('author' in input) updates.author = requireString(input.author, 'author');
  if ('isbn' in input) updates.isbn = requireString(input.isbn, 'isbn');
  if ('price' in input) updates.price = requirePositiveNumber(input.price, 'price');
  if ('stock' in input) updates.stock = requireNonNegativeInteger(input.stock, 'stock');
  if ('description' in input) updates.description = requireString(input.description, 'description');
  if ('category' in input) updates.category = requireString(input.category, 'category');
  if ('publishedYear' in input) updates.publishedYear = requirePositiveInteger(input.publishedYear, 'publishedYear');
  if ('imageUrl' in input) updates.imageUrl = optionalString(input.imageUrl);
  if ('rating' in input) updates.rating = input.rating;
  if ('reviewCount' in input) updates.reviewCount = input.reviewCount;
  if ('isFeatured' in input) updates.isFeatured = Boolean(input.isFeatured);
  if ('isBestseller' in input) updates.isBestseller = Boolean(input.isBestseller);
  if ('isNew' in input) updates.isNew = Boolean(input.isNew);
  if ('discount' in input) updates.discount = input.discount;

  return updates;
}
