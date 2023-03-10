import { Injectable } from '@nestjs/common';
import * as TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';
import { CronJob } from 'cron';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Subscriber, SubscriberDocument } from './subscriber.schema';

@Injectable()
export class TelegramBotService {
  private readonly bot: TelegramBot;

  constructor(
    @InjectModel(Subscriber.name)
    private readonly subscriberModel: Model<SubscriberDocument>,
  ) {
    this.bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
      polling: true,
    });
  }

  public async start(): Promise<void> {
    this.bot.onText(/\/help/, (msg) => {
      this.bot.sendMessage(msg.chat.id, 'Hello! Here are the functionalities of this bot:\n\n/subscribe - Subscribe to daily Bitcoin updates.\n/unsubscribe - Unsubscribe from daily Bitcoin updates.');
    });

    this.bot.onText(/\/subscribe/, (msg) => {
      this.subscribeUser(msg.chat.id);
    });

    this.bot.onText(/\/unsubscribe/, (msg) => {
      this.unsubscribeUser(msg.chat.id);
    });

    await this.startBitcoinUpdates();
  }

  private async subscribeUser(chatId: number): Promise<void> {
    const subscriber = await this.subscriberModel.findOne({ chatId }).exec();
    if (subscriber) {
      this.bot.sendMessage(chatId, 'You are already subscribed!');
      return;
    }

    const newSubscriber = new this.subscriberModel({ chatId });
    await newSubscriber.save();
    this.bot.sendMessage(
      chatId,
      'You have been subscribed to daily Bitcoin updates.',
    );
  }

  private async unsubscribeUser(chatId: number): Promise<void> {
    const subscriber = await this.subscriberModel.findOne({ chatId }).exec();
    if (!subscriber) {
      this.bot.sendMessage(chatId, 'You are not subscribed yet!');
      return;
    }

    await subscriber.delete();
    this.bot.sendMessage(
      chatId,
      'You have been unsubscribed from daily Bitcoin updates.',
    );
  }

  private async startBitcoinUpdates(): Promise<void> {
    const job = new CronJob('*/5 * * * *', async () => {
      const price = await this.getBitcoinPrice();
      const message = `The value of Bitcoin is currently $${price.toLocaleString()}.`;

      const subscribers = await this.subscriberModel.find().exec();
      for (const subscriber of subscribers) {
        this.bot.sendMessage(subscriber.chatId, message);
      }
    });

    job.start();
  }

  private async getBitcoinPrice(): Promise<number> {
    const API_URL = process.env.API_URL;
    const response = await axios.get(API_URL);
    const usdRate = response.data.bpi.USD.rate_float;
    return Math.round(usdRate);
  }
}
