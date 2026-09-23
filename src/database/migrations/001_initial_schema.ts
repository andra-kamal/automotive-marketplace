import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('categories')
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('parent_id', 'integer', (col) => col.references('categories.id').onDelete('cascade'))
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .addColumn('slug', 'varchar(255)', (col) => col.notNull().unique())
    .addColumn('created_at', 'timestamp', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull())
    .execute();

  await db.schema
    .createTable('category_filters')
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('category_id', 'integer', (col) => col.references('categories.id').onDelete('cascade').notNull())
    .addColumn('filter_key', 'varchar(255)', (col) => col.notNull())
    .addColumn('filter_type', 'varchar(50)', (col) => col.notNull()) // enum, range, boolean
    .addColumn('options', 'json') // JSON array of options for enum
    .execute();

  await db.schema
    .createTable('listings')
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('category_id', 'integer', (col) => col.references('categories.id').onDelete('restrict').notNull())
    .addColumn('make', 'varchar(255)', (col) => col.notNull())
    .addColumn('model', 'varchar(255)', (col) => col.notNull())
    .addColumn('year', 'integer', (col) => col.notNull())
    .addColumn('mileage', 'integer', (col) => col.notNull())
    .addColumn('price', 'decimal(15, 2)', (col) => col.notNull())
    .addColumn('condition', 'varchar(50)', (col) => col.notNull())
    .addColumn('transmission', 'varchar(100)')
    .addColumn('fuel_type', 'varchar(100)')
    .addColumn('color', 'varchar(100)', (col) => col.notNull())
    .addColumn('images', 'json', (col) => col.notNull())
    .addColumn('location', 'varchar(255)', (col) => col.notNull())
    .addColumn('status', 'varchar(50)', (col) => col.notNull().defaultTo('available')) // available, sold, pending
    .addColumn('dynamic_attributes', 'json') // Category-specific filters
    .addColumn('created_at', 'timestamp', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull())
    .addColumn('updated_at', 'timestamp', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull())
    .addColumn('deleted_at', 'timestamp')
    .execute();

  // Full Text Search Index for MySQL
  // MySQL supports FULLTEXT indexes on InnoDB since 5.6
  await sql`ALTER TABLE listings ADD FULLTEXT INDEX ft_make_model_location (make, model, location)`.execute(db);

  // Faceted search indexes
  await db.schema.createIndex('idx_listings_category_id').on('listings').column('category_id').execute();
  await db.schema.createIndex('idx_listings_price').on('listings').column('price').execute();
  await db.schema.createIndex('idx_listings_year').on('listings').column('year').execute();
  await db.schema.createIndex('idx_listings_status').on('listings').column('status').execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('listings').execute();
  await db.schema.dropTable('category_filters').execute();
  await db.schema.dropTable('categories').execute();
}
