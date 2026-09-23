import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';
import { DatabaseService } from '../database/database.service.js';
import { sql } from 'kysely';

@Injectable()
export class CategoriesService {
  constructor(@Inject(DatabaseService) private dbService: DatabaseService) {}

  async create(createCategoryDto: CreateCategoryDto) {
    const { name, slug, parent_id } = createCategoryDto;
    const result = await this.dbService.db
      .insertInto('categories')
      .values({ name, slug, parent_id })
      .executeTakeFirstOrThrow();
    
    return { id: Number(result.insertId), name, slug, parent_id };
  }

  async getCategoryTree() {
    // Arbitrary depth category tree using recursive CTE
    const query = sql`
      WITH RECURSIVE category_tree AS (
        SELECT id, name, slug, parent_id,
               CAST(CONCAT('[', id, ']') AS CHAR(255)) as path,
               0 as depth
        FROM categories
        WHERE parent_id IS NULL

        UNION ALL

        SELECT c.id, c.name, c.slug, c.parent_id,
               CAST(CONCAT(ct.path, ',', '[', c.id, ']') AS CHAR(255)) as path,
               ct.depth + 1
        FROM categories c
        INNER JOIN category_tree ct ON ct.id = c.parent_id
      )
      SELECT * FROM category_tree ORDER BY path;
    `;
    
    const { rows } = await query.execute(this.dbService.db);
    
    // Build tree in memory for the response
    return this.buildTree(rows as any[]);
  }

  private buildTree(categories: any[]) {
    const map = new Map();
    const roots: any[] = [];
    
    categories.forEach((cat) => {
      map.set(cat.id, { ...cat, children: [] });
    });
    
    categories.forEach((cat) => {
      if (cat.parent_id === null) {
        roots.push(map.get(cat.id));
      } else {
        const parent = map.get(cat.parent_id);
        if (parent) {
          parent.children.push(map.get(cat.id));
        }
      }
    });
    
    return roots;
  }

  async getCategoryWithChildren(id: number) {
    const query = sql`
      WITH RECURSIVE category_tree AS (
        SELECT id, name, slug, parent_id
        FROM categories
        WHERE id = ${id}

        UNION ALL

        SELECT c.id, c.name, c.slug, c.parent_id
        FROM categories c
        INNER JOIN category_tree ct ON ct.id = c.parent_id
      )
      SELECT * FROM category_tree;
    `;
    
    const { rows } = await query.execute(this.dbService.db);
    if (rows.length === 0) {
      throw new NotFoundException(`Category #${id} not found`);
    }
    
    return this.buildTree(rows as any[])[0]; // Return the tree rooted at this id
  }

  async getListingsByCategory(categoryId: number) {
    // Uses CTE to find all subcategories, then fetches listings
    const query = sql`
      WITH RECURSIVE category_tree AS (
        SELECT id FROM categories WHERE id = ${categoryId}
        UNION ALL
        SELECT c.id FROM categories c
        INNER JOIN category_tree ct ON ct.id = c.parent_id
      )
      SELECT * FROM listings 
      WHERE category_id IN (SELECT id FROM category_tree)
      AND deleted_at IS NULL
    `;
    
    const { rows } = await query.execute(this.dbService.db);
    return rows;
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    const result = await this.dbService.db
      .updateTable('categories')
      .set(updateCategoryDto)
      .where('id', '=', id)
      .executeTakeFirst();
      
    if (Number(result.numUpdatedRows) === 0) {
      throw new NotFoundException(`Category #${id} not found or no changes made`);
    }
    return { id, ...updateCategoryDto };
  }
}
