import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  categoryName: string | undefined;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    categoryName,
  }: Request): Promise<Transaction> {
    const categoryRepository = getRepository(Category);

    let category = await categoryRepository.findOne({
      where: {
        title: categoryName,
      },
    });

    if (!category) {
      category = categoryRepository.create({
        title: categoryName,
      });
      await categoryRepository.save(category);
    }

    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const balance = await transactionsRepository.getBalance();

    if (type === 'outcome' && balance.total < value) {
      throw new AppError('output value is greater than the total');
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category,
    });
    await transactionsRepository.save(transaction);
    return transaction;
  }
}

export default CreateTransactionService;
