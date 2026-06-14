function stripUndefinedValues(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined),
  );
}

export function getUserRole(user) {
  return user?.role ?? user?.prefs?.role ?? 'user';
}

export function toPublicUser(appwriteUser, profile = null, address = undefined) {
  return stripUndefinedValues({
    $id: appwriteUser.$id,
    name: appwriteUser.name,
    email: appwriteUser.email,
    role: getUserRole(appwriteUser),
    phone: profile?.phone,
    address,
  });
}

export function toPublicBook(book) {
  return stripUndefinedValues({
    $id: book.id,
    title: book.title,
    author: book.author,
    isbn: book.isbn,
    price: book.price,
    stock: book.stock,
    description: book.description,
    category: book.category,
    publishedYear: book.publishedYear,
    imageUrl: book.imageUrl,
    rating: book.rating ?? 0,
    reviewCount: book.reviewCount ?? 0,
    isFeatured: book.isFeatured ?? false,
    isBestseller: book.isBestseller ?? false,
    isNew: book.isNew ?? false,
    discount: book.discount,
    createdAt: book.createdAt,
    updatedAt: book.updatedAt,
  });
}

export function toPublicOrder(order, shippingAddress) {
  return stripUndefinedValues({
    $id: order.id,
    userId: order.userId,
    items: order.items,
    totalAmount: order.totalAmount,
    status: order.status,
    shippingAddress,
    trackingNumber: order.trackingNumber,
    estimatedDelivery: order.estimatedDelivery,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  });
}
