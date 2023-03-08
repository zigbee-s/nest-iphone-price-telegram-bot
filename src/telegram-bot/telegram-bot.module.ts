import { Module } from '@nestjs/common';
import { TelegramBotService } from './telegram-bot.service';

@Module({
  providers: [TelegramBotService],
})
export class TelegramBotModule {
  constructor(private readonly telegramBotService: TelegramBotService) {}

  public async onModuleInit() {
    await this.telegramBotService.start();
  }
}
