import { Injectable, Query, HttpStatus } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaClient } from '@prisma/client';
import { OnModuleInit } from '@nestjs/common';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Product } from '@prisma/client';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class ProductsService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
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
      throw new RpcException({
        message: `Product with id ${id} not found`,
        status: HttpStatus.NOT_FOUND,
      });
    }
    return product;
  }

  async update(
    id: number,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const { id: __, ...data } = updateProductDto;
    await this.findOne(id);
    try {
      const product = await this.product.update({ where: { id }, data });
      return product;
    } catch (error) {
      throw new RpcException(error as object);
    }
  }

  async remove(id: number): Promise<Product> {
    await this.findOne(id);
    try {
      return await this.product.update({
        where: { id },
        data: { available: false },
      });
    } catch (error) {
      throw new RpcException(error as object);
    }
  }

  async validateProducts(ids: number[]) {
    ids = Array.from(new Set(ids));
    const products = await this.product.findMany({
      where: { id: { in: ids }, available: true },
    });
    if (products.length !== ids.length) {
      throw new RpcException({
        message: `Some products not found`,
        status: HttpStatus.NOT_FOUND,
      });
    }
    return products;
  }
}
