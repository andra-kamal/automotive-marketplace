import { Generated, JSONColumnType } from 'kysely';

export interface Database {
  categories: CategoryTable;
  category_filters: CategoryFilterTable;
  listings: ListingTable;
}

export interface CategoryTable {
  id: Generated<number>;
  parent_id: number | null;
  name: string;
  slug: string;
  created_at: Generated<Date>;
}

export interface CategoryFilterTable {
  id: Generated<number>;
  category_id: number;
  filter_key: string;
  filter_type: 'enum' | 'range' | 'boolean';
  options: JSONColumnType<string[]> | null;
}

export interface ListingTable {
  id: Generated<number>;
  category_id: number;
  make: string;
  model: string;
  year: number;
  mileage: number;
  price: string; // decimal as string in JS
  condition: string;
  transmission: string | null;
  fuel_type: string | null;
  color: string;
  images: JSONColumnType<string[]>;
  location: string;
  status: string; // available, sold, pending
  dynamic_attributes: JSONColumnType<Record<string, any>> | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
  deleted_at: Date | null;
}
