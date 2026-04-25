import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { LoggerModule } from './common/logger/logger.module';
import { CloudinaryModule } from './common/cloudinary/cloudinary.module';
import { PrismaService } from './prisma.service';
import { UsersModule } from './users/users.module';
import { MailModule } from './mail/mail.module';
import { ZonesModule } from './zones/zones.module';
import { TablesModule } from './tables/tables.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AdminCategoriesModule } from './admin-categories/admin-categories.module';
import { AdminZonesModule } from './admin-zones/admin-zones.module';
import { AdminTablesModule } from './admin-tables/admin-tables.module';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    forwardRef(() => AuthModule),
    LoggerModule,
    CloudinaryModule,
    UsersModule,
    MailModule,
    ZonesModule,
    TablesModule,
    CategoriesModule,
    ProductsModule,
    DashboardModule,
    AdminCategoriesModule,
    AdminZonesModule,
    AdminTablesModule,
    OrdersModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
