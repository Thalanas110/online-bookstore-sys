/**
 * Seed Script for Appwrite Database
 * 
 * This script populates your Appwrite database with initial book data.
 * 
 * Usage:
 * 1. npm install appwrite (if not already installed)
 * 2. Update the configuration below with your Appwrite credentials
 * 3. node scripts/seed-data.js
 */

import { Client, Databases, ID } from 'appwrite';

// Configuration - Update these values
const config = {
  endpoint: 'https://cloud.appwrite.io/v1',
  projectId: 'YOUR_PROJECT_ID',
  databaseId: 'bookstore',
  booksCollectionId: 'books',
};

// Initialize Appwrite
const client = new Client()
  .setEndpoint(config.endpoint)
  .setProject(config.projectId);

const databases = new Databases(client);

// Sample book data
const sampleBooks = [
  {
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    isbn: '978-0743273565',
    price: 15.99,
    stock: 50,
    description: 'A classic American novel set in the Jazz Age, exploring themes of wealth, love, and the American Dream.',
    category: 'Fiction',
    publishedYear: 1925,
  },
  {
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    isbn: '978-0061120084',
    price: 18.99,
    stock: 35,
    description: 'A gripping tale of racial injustice and childhood innocence in the American South.',
    category: 'Fiction',
    publishedYear: 1960,
  },
  {
    title: '1984',
    author: 'George Orwell',
    isbn: '978-0451524935',
    price: 16.99,
    stock: 45,
    description: 'A dystopian social science fiction novel about totalitarianism and surveillance.',
    category: 'Science Fiction',
    publishedYear: 1949,
  },
  {
    title: 'The Hobbit',
    author: 'J.R.R. Tolkien',
    isbn: '978-0547928227',
    price: 14.99,
    stock: 60,
    description: 'A fantasy novel about the adventure of Bilbo Baggins in Middle-earth.',
    category: 'Fantasy',
    publishedYear: 1937,
  },
  {
    title: 'Clean Code',
    author: 'Robert C. Martin',
    isbn: '978-0132350884',
    price: 42.99,
    stock: 25,
    description: 'A handbook of agile software craftsmanship for writing clean, maintainable code.',
    category: 'Technology',
    publishedYear: 2008,
  },
  {
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    isbn: '978-0141439518',
    price: 12.99,
    stock: 40,
    description: 'A romantic novel of manners set in Georgian England.',
    category: 'Fiction',
    publishedYear: 1813,
  },
  {
    title: 'The Catcher in the Rye',
    author: 'J.D. Salinger',
    isbn: '978-0316769174',
    price: 13.99,
    stock: 30,
    description: 'A controversial novel about teenage rebellion and alienation.',
    category: 'Fiction',
    publishedYear: 1951,
  },
  {
    title: 'Harry Potter and the Sorcerer\'s Stone',
    author: 'J.K. Rowling',
    isbn: '978-0439708180',
    price: 19.99,
    stock: 100,
    description: 'The first book in the magical Harry Potter series.',
    category: 'Fantasy',
    publishedYear: 1997,
  },
  {
    title: 'The Lord of the Rings',
    author: 'J.R.R. Tolkien',
    isbn: '978-0544003415',
    price: 35.99,
    stock: 55,
    description: 'An epic high-fantasy trilogy about the quest to destroy the One Ring.',
    category: 'Fantasy',
    publishedYear: 1954,
  },
  {
    title: 'Dune',
    author: 'Frank Herbert',
    isbn: '978-0441172719',
    price: 17.99,
    stock: 38,
    description: 'A science fiction masterpiece set on the desert planet Arrakis.',
    category: 'Science Fiction',
    publishedYear: 1965,
  },
  {
    title: 'The Pragmatic Programmer',
    author: 'David Thomas and Andrew Hunt',
    isbn: '978-0135957059',
    price: 44.99,
    stock: 20,
    description: 'Your journey to mastery in software development.',
    category: 'Technology',
    publishedYear: 2019,
  },
  {
    title: 'Sapiens',
    author: 'Yuval Noah Harari',
    isbn: '978-0062316110',
    price: 24.99,
    stock: 45,
    description: 'A brief history of humankind from the Stone Age to the modern age.',
    category: 'Non-Fiction',
    publishedYear: 2011,
  },
  {
    title: 'Educated',
    author: 'Tara Westover',
    isbn: '978-0399590504',
    price: 16.99,
    stock: 32,
    description: 'A memoir about a woman who grows up in a survivalist family and eventually gets a PhD.',
    category: 'Non-Fiction',
    publishedYear: 2018,
  },
  {
    title: 'Atomic Habits',
    author: 'James Clear',
    isbn: '978-0735211292',
    price: 26.99,
    stock: 65,
    description: 'An easy and proven way to build good habits and break bad ones.',
    category: 'Self-Help',
    publishedYear: 2018,
  },
  {
    title: 'The Lean Startup',
    author: 'Eric Ries',
    isbn: '978-0307887894',
    price: 22.99,
    stock: 28,
    description: 'How today\'s entrepreneurs use continuous innovation to create successful businesses.',
    category: 'Business',
    publishedYear: 2011,
  },
];

async function seedBooks() {
  console.log('🌱 Starting to seed book data...\n');

  let successCount = 0;
  let errorCount = 0;

  for (const book of sampleBooks) {
    try {
      const result = await databases.createDocument(
        config.databaseId,
        config.booksCollectionId,
        ID.unique(),
        book
      );
      
      console.log(`✅ Added: ${book.title} by ${book.author}`);
      successCount++;
    } catch (error) {
      console.error(`❌ Failed to add: ${book.title}`);
      console.error(`   Error: ${error.message}`);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`📊 Seeding complete!`);
  console.log(`   Success: ${successCount} books`);
  console.log(`   Failed: ${errorCount} books`);
  console.log('='.repeat(50));
}

// Run the seed function
seedBooks()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error.message);
    process.exit(1);
  });
