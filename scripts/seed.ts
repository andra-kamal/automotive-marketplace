import { Kysely, MysqlDialect } from 'kysely';
import { createPool } from 'mysql2';
import * as dotenv from 'dotenv';
import { faker } from '@faker-js/faker';
import { Database } from '../src/database/schema.js';

dotenv.config();

async function seed() {
  const db = new Kysely<Database>({
    dialect: new MysqlDialect({
      pool: createPool({
        host: process.env.MYSQLHOST || process.env.DB_HOST || '127.0.0.1',
        user: process.env.MYSQLUSER || process.env.DB_USER || 'user',
        password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || 'password',
        database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'automotive_marketplace',
        port: Number(process.env.MYSQLPORT || process.env.DB_PORT) || 3306,
        connectionLimit: 1,
      }),
    }),
  });

  console.log('Seeding categories...');
  // Delete existing data
  await db.deleteFrom('listings').execute();
  await db.deleteFrom('category_filters').execute();
  await db.deleteFrom('categories').execute();

  // Create Categories
  const carsRes = await db
    .insertInto('categories')
    .values({ name: 'Cars', slug: 'cars' })
    .executeTakeFirstOrThrow();
  const carsId = Number(carsRes.insertId);

  const suvRes = await db
    .insertInto('categories')
    .values({ name: 'SUV', slug: 'suv', parent_id: carsId })
    .executeTakeFirstOrThrow();
  const suvId = Number(suvRes.insertId);

  const sedRes = await db
    .insertInto('categories')
    .values({ name: 'Sedan', slug: 'sedan', parent_id: carsId })
    .executeTakeFirstOrThrow();
  const sedanId = Number(sedRes.insertId);

  const motorcyclesRes = await db
    .insertInto('categories')
    .values({ name: 'Motorcycles', slug: 'motorcycles' })
    .executeTakeFirstOrThrow();
  const motorcyclesId = Number(motorcyclesRes.insertId);

  // Category Filters
  await db
    .insertInto('category_filters')
    .values([
      {
        category_id: carsId,
        filter_key: 'doors',
        filter_type: 'range',
        options: null,
      },
      {
        category_id: suvId,
        filter_key: 'seats',
        filter_type: 'enum',
        options: JSON.stringify(['5', '7', '8']), // Kysely JSON serialization
      },
      {
        category_id: motorcyclesId,
        filter_key: 'engine_type',
        filter_type: 'enum',
        options: JSON.stringify(['2-stroke', '4-stroke']),
      },
    ])
    .execute();

  console.log('Seeding listings...');
  const categoryIds = [carsId, suvId, sedanId, motorcyclesId];
  const statuses = ['available', 'sold', 'pending'];
  const conditions = ['New', 'Used - Like New', 'Used - Good', 'Used - Fair'];
  const fuelTypes = ['Gasoline', 'Diesel', 'Electric', 'Hybrid'];
  const transmissions = ['Automatic', 'Manual', 'CVT'];

  const listings = Array.from({ length: 500 }).map(() => {
    const category_id = faker.helpers.arrayElement(categoryIds);
    const dynamic_attributes: Record<string, any> = {};

    if (category_id === carsId || category_id === suvId || category_id === sedanId) {
      dynamic_attributes.doors = faker.helpers.arrayElement([2, 4, 5]);
      if (category_id === suvId) {
        dynamic_attributes.seats = faker.helpers.arrayElement(['5', '7', '8']);
      }
    } else if (category_id === motorcyclesId) {
      dynamic_attributes.engine_type = faker.helpers.arrayElement(['2-stroke', '4-stroke']);
    }

    return {
      category_id,
      make: faker.vehicle.manufacturer(),
      model: faker.vehicle.model(),
      year: faker.date.past({ years: 20 }).getFullYear(),
      mileage: faker.number.int({ min: 0, max: 200000 }),
      price: faker.finance.amount({ min: 1000, max: 100000, dec: 2 }),
      condition: faker.helpers.arrayElement(conditions),
      transmission: category_id === motorcyclesId ? 'Manual' : faker.helpers.arrayElement(transmissions),
      fuel_type: faker.helpers.arrayElement(fuelTypes),
      color: faker.color.human(),
      images: JSON.stringify([faker.image.urlLoremFlickr({ category: 'car' })]),
      location: faker.location.city(),
      status: faker.helpers.arrayElement(statuses),
      dynamic_attributes: JSON.stringify(dynamic_attributes),
    };
  });

  // Batch insert due to MySQL limitations on max placeholders
  const chunkSize = 100;
  for (let i = 0; i < listings.length; i += chunkSize) {
    const chunk = listings.slice(i, i + chunkSize);
    await db.insertInto('listings').values(chunk).execute();
  }

  console.log('Seeding complete!');
  await db.destroy();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
