import { Injectable, NotFoundException, Query } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaClient } from '@prisma/client';
import { OnModuleInit } from '@nestjs/common';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Product } from '@prisma/client';

@Injectable()
export class ProductsService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
    console.log('Connected to database');
  }

  create(createProductDto: CreateProductDto) {
    return this.product.create({ data: createProductDto });
  }

  async findAll(@Query() paginationDto: PaginationDto) {
    const { page, limit } = paginationDto;

    const total = await this.product.count({ where: { available: true } });
    const lastPage = Math.ceil(total / limit!);

    const products = await this.product.findMany({
      where: { available: true },
      take: limit,
      skip: (page! - 1) * limit!,
    });

    return {
      data: products,
      meta: {
        total,
        page,
        lastPage,
      },
    };
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.product.findUnique({
      where: { id, available: true },
    });
    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }
    return product;
  }

  async update(
    id: number,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const { id: __, ...data } = updateProductDto;
    await this.findOne(id);
    return this.product.update({ where: { id }, data });
  }

  async remove(id: number): Promise<Product> {
    await this.findOne(id);
    return this.product.update({ where: { id }, data: { available: false } });
  }
}
