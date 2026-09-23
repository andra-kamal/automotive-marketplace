import { Injectable, Inject } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { sql } from 'kysely';

@Injectable()
export class FiltersService {
  constructor(@Inject(DatabaseService) private dbService: DatabaseService) {}

  async findAll() {
    // Return all available filters for all categories
    const results = await this.dbService.db
      .selectFrom('category_filters')
      .selectAll()
      .execute();
      
    return results;
  }

  async findByCategory(categoryId: number) {
    // Find filters for this category and its parent categories
    // e.g. SUV inherits filters from Cars
    const query = sql`
      WITH RECURSIVE category_path AS (
        SELECT id, parent_id FROM categories WHERE id = ${categoryId}
        UNION ALL
        SELECT c.id, c.parent_id FROM categories c
        INNER JOIN category_path cp ON cp.parent_id = c.id
      )
      SELECT cf.* 
      FROM category_filters cf
      WHERE cf.category_id IN (SELECT id FROM category_path)
    `;
    
    const { rows } = await query.execute(this.dbService.db);
    return rows;
  }
}
