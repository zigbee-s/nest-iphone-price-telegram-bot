import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TelegramBotService } from './telegram-bot.service';
import { Subscriber, SubscriberSchema } from './subscriber.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Subscriber.name, schema: SubscriberSchema },
    ]), // configure model
  ],
  providers: [TelegramBotService],
})
export class TelegramBotModule {
  constructor(private readonly telegramBotService: TelegramBotService) {}

  public async onModuleInit() {
    await this.telegramBotService.start();
  }
}
