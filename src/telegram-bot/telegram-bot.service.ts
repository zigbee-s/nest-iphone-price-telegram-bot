import { Injectable } from '@nestjs/common';
import * as TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';
import * as schedule from 'node-schedule';

@Injectable()
export class TelegramBotService {
  private readonly bot: TelegramBot;
  private readonly subscribers: Set<number> = new Set();

  constructor() {
    this.bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
      polling: true,
    });
  }

  public start() {
    this.bot.onText(/\/help/, (msg) => {
      this.bot.sendMessage(msg.chat.id, 'Hello! How can I help you?');
    });

    this.bot.onText(/\/subscribe/, (msg) => {
      this.subscribeUser(msg.chat.id);
    });
  }

  private subscribeUser(chatId: number): void {
    if (this.subscribers.has(chatId)) {
      this.bot.sendMessage(chatId, 'You are already subscribed!');
      return;
    }

    this.subscribers.add(chatId);
    this.bot.sendMessage(chatId, 'You have been subscribed to daily Bitcoin updates.');

    if (this.subscribers.size === 1) {
      this.startBitcoinUpdates();
    }
  }

  private startBitcoinUpdates(): void {
    const rule = new schedule.RecurrenceRule();
    rule.hour = 17;
    rule.minute = 44;
    rule.second = 0;

    schedule.scheduleJob(rule, async () => {
      const price = await this.getBitcoinPrice();
      const message = `The value of Bitcoin is currently $${price.toLocaleString()}.`;

      for (const chatId of this.subscribers) {
        this.bot.sendMessage(chatId, message);
      }
    });
  }

  private async getBitcoinPrice(): Promise<number> {
    const API_URL = 'https://api.coindesk.com/v1/bpi/currentprice.json';
    const response = await axios.get(API_URL);
    const usdRate = response.data.bpi.USD.rate_float;
    return Math.round(usdRate);
  }
}
