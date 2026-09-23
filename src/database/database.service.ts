import { Injectable, Inject, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kysely, MysqlDialect } from 'kysely';
import { createPool } from 'mysql2';
import { Database } from './schema.js';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  public readonly db: Kysely<Database>;

  constructor(@Inject(ConfigService) private configService: ConfigService) {
    const dialect = new MysqlDialect({
      pool: createPool({
        host: this.configService.get<string>('DB_HOST', '127.0.0.1'),
        user: this.configService.get<string>('DB_USER', 'user'),
        password: this.configService.get<string>('DB_PASSWORD', 'password'),
        database: this.configService.get<string>('DB_NAME', 'automotive_marketplace'),
        port: this.configService.get<number>('DB_PORT', 3306),
        connectionLimit: 10,
      }),
    });

    this.db = new Kysely<Database>({
      dialect,
    });
  }

  async onModuleInit() {
    // Optionally check connection
  }

  async onModuleDestroy() {
    await this.db.destroy();
  }
}
