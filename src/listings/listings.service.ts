import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { CreateListingDto } from './dto/create-listing.dto.js';
import { UpdateListingDto } from './dto/update-listing.dto.js';
import { DatabaseService } from '../database/database.service.js';
import { sql } from 'kysely';

@Injectable()
export class ListingsService {
  constructor(@Inject(DatabaseService) private dbService: DatabaseService) {}

  async create(createListingDto: CreateListingDto) {
    const imagesJson = JSON.stringify(createListingDto.images);
    const dynamicAttrJson = createListingDto.dynamic_attributes 
      ? JSON.stringify(createListingDto.dynamic_attributes) 
      : null;

    const result = await this.dbService.db
      .insertInto('listings')
      .values({
        ...createListingDto,
        images: imagesJson,
        dynamic_attributes: dynamicAttrJson,
      })
      .executeTakeFirstOrThrow();

    return { id: Number(result.insertId), ...createListingDto };
  }

  async findAll(queryParam: any) {
    let query = this.dbService.db
      .selectFrom('listings')
      .selectAll()
      .where('deleted_at', 'is', null);

    // Apply filters
    if (queryParam.category_id) {
      // Get all subcategories
      const subcategories = await this.dbService.db.executeQuery(sql`
        WITH RECURSIVE category_tree AS (
          SELECT id FROM categories WHERE id = ${Number(queryParam.category_id)}
          UNION ALL
          SELECT c.id FROM categories c
          INNER JOIN category_tree ct ON ct.id = c.parent_id
        )
        SELECT id FROM category_tree;
      `.compile(this.dbService.db));
      
      const categoryIds = subcategories.rows.map((r: any) => r.id);
      if (categoryIds.length > 0) {
        query = query.where('category_id', 'in', categoryIds);
      }
    }

    if (queryParam.make) {
      query = query.where('make', '=', queryParam.make);
    }
    if (queryParam.year_min) {
      query = query.where('year', '>=', Number(queryParam.year_min));
    }
    if (queryParam.year_max) {
      query = query.where('year', '<=', Number(queryParam.year_max));
    }
    if (queryParam.price_min) {
      query = query.where('price', '>=', queryParam.price_min);
    }
    if (queryParam.price_max) {
      query = query.where('price', '<=', queryParam.price_max);
    }

    // Dynamic attributes filtering using JSON functions (MySQL)
    if (queryParam.attributes) {
      try {
        const attributes = JSON.parse(queryParam.attributes);
        for (const [key, value] of Object.entries(attributes)) {
          query = query.where(sql`JSON_EXTRACT(dynamic_attributes, ${'$.' + key})`, '=', value as any);
        }
      } catch (e) {
        // ignore invalid json
      }
    }

    // Cursor Pagination (keyset pagination on created_at DESC, id DESC)
    const limit = Number(queryParam.limit) || 20;
    
    if (queryParam.cursor) {
      // Decode cursor. Example format: Base64("timestamp_id")
      const decoded = Buffer.from(queryParam.cursor, 'base64').toString('utf-8');
      const [createdAtStr, idStr] = decoded.split('_');
      if (createdAtStr && idStr) {
        query = query.where((eb) => eb.or([
          eb('created_at', '<', new Date(createdAtStr)),
          eb.and([
            eb('created_at', '=', new Date(createdAtStr)),
            eb('id', '<', Number(idStr))
          ])
        ]));
      }
    }

    query = query.orderBy('created_at', 'desc').orderBy('id', 'desc').limit(limit + 1);
    
    const results = await query.execute();
    
    let nextCursor = null;
    if (results.length > limit) {
      const nextItem = results.pop();
      if (nextItem) {
        const cursorStr = `${nextItem.created_at.toISOString()}_${nextItem.id}`;
        nextCursor = Buffer.from(cursorStr).toString('base64');
      }
    }

    return {
      data: results,
      next_cursor: nextCursor,
    };
  }

  async findOne(id: number) {
    const result = await this.dbService.db
      .selectFrom('listings')
      .selectAll()
      .where('id', '=', id)
      .where('deleted_at', 'is', null)
      .executeTakeFirst();

    if (!result) {
      throw new NotFoundException(`Listing #${id} not found`);
    }

    return result;
  }

  async update(id: number, updateListingDto: UpdateListingDto) {
    const updateData: any = { ...updateListingDto, updated_at: sql`CURRENT_TIMESTAMP` };
    
    if (updateListingDto.images) {
      updateData.images = JSON.stringify(updateListingDto.images);
    }
    if (updateListingDto.dynamic_attributes) {
      updateData.dynamic_attributes = JSON.stringify(updateListingDto.dynamic_attributes);
    }

    const result = await this.dbService.db
      .updateTable('listings')
      .set(updateData)
      .where('id', '=', id)
      .where('deleted_at', 'is', null)
      .executeTakeFirst();

    if (Number(result.numUpdatedRows) === 0) {
      throw new NotFoundException(`Listing #${id} not found or no changes made`);
    }

    return this.findOne(id);
  }

  async remove(id: number) {
    const result = await this.dbService.db
      .updateTable('listings')
      .set({ deleted_at: sql`CURRENT_TIMESTAMP`, status: 'removed' })
      .where('id', '=', id)
      .where('deleted_at', 'is', null)
      .executeTakeFirst();

    if (Number(result.numUpdatedRows) === 0) {
      throw new NotFoundException(`Listing #${id} not found`);
    }

    return { message: 'Listing soft deleted successfully' };
  }

  // --- Search & Filters (Could also be in Search module, but placed here since SearchModule was imported) ---
  
  async search(queryParam: any) {
    let query = this.dbService.db
      .selectFrom('listings')
      .selectAll()
      .where('deleted_at', 'is', null);

    // Full-Text Search in MySQL using MATCH() AGAINST()
    if (queryParam.q) {
      query = query.where(sql`MATCH(make, model, location) AGAINST(${queryParam.q} IN BOOLEAN MODE)`);
    }

    // Apply the same filters as findAll
    if (queryParam.category_id) {
      const subcategories = await this.dbService.db.executeQuery(sql`
        WITH RECURSIVE category_tree AS (
          SELECT id FROM categories WHERE id = ${Number(queryParam.category_id)}
          UNION ALL
          SELECT c.id FROM categories c
          INNER JOIN category_tree ct ON ct.id = c.parent_id
        )
        SELECT id FROM category_tree;
      `.compile(this.dbService.db));
      const categoryIds = subcategories.rows.map((r: any) => r.id);
      if (categoryIds.length > 0) {
        query = query.where('category_id', 'in', categoryIds);
      }
    }

    if (queryParam.make) query = query.where('make', '=', queryParam.make);
    if (queryParam.status) query = query.where('status', '=', queryParam.status);

    query = query.orderBy('created_at', 'desc').limit(50); // Hard limit for search

    const results = await query.execute();
    return { data: results };
  }

  async suggest(q: string) {
    if (!q || q.length < 2) return [];
    
    // Suggest make, model, or location
    const qLike = `%${q}%`;
    const results = await this.dbService.db
      .selectFrom('listings')
      .select(['make', 'model', 'location'])
      .where('deleted_at', 'is', null)
      .where((eb) => eb.or([
        eb('make', 'like', qLike),
        eb('model', 'like', qLike),
        eb('location', 'like', qLike),
      ]))
      .limit(10)
      .execute();

    // Deduplicate suggestions
    const suggestions = new Set<string>();
    const lowerQ = q.toLowerCase();
    
    results.forEach(r => {
      if (r.make.toLowerCase().includes(lowerQ)) suggestions.add(r.make);
      if (r.model.toLowerCase().includes(lowerQ)) suggestions.add(`${r.make} ${r.model}`);
      if (r.location.toLowerCase().includes(lowerQ)) suggestions.add(r.location);
    });

    return Array.from(suggestions).slice(0, 10);
  }
}
