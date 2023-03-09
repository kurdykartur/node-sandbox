import { Channel, Connection } from 'amqplib';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { RabbitConnector } from '../rabbitConnector.ts/rabbitConnector';
import { ScheduleConfig } from './scheduleConsumer.types';

dayjs.extend(utc);

export class ScheduleConsumer {
  private channel: Channel | null;
  private connection: Connection | null;

  constructor(private scheduleConfig: ScheduleConfig, private rabbitConnector: RabbitConnector) {
    this.scheduleConfig = scheduleConfig;
    this.rabbitConnector = rabbitConnector;
  }

  private init = async () => {
    this.connection = await this.rabbitConnector.connectToRabbit();
    this.channel = await this.rabbitConnector.createChannel(this.connection);

    if (this.channel) {
      await this.rabbitConnector.assertExchange(this.channel, this.scheduleConfig.targetExchange, 'direct');
      await this.rabbitConnector.assertQueue(this.channel, this.scheduleConfig.targetQueue);
      await this.rabbitConnector.bindQueueToExchange(
        this.channel,
        this.scheduleConfig.targetQueue,
        this.scheduleConfig.targetExchange,
        this.scheduleConfig.routingKey,
      );
    }
  };

  private generatePayload = async (iteratorValue: number) => {
    const message = {};
    for (let index = 0; index < this.scheduleConfig.staticFields.length; index++) {
      const element = this.scheduleConfig.staticFields[index];
      message[element.fieldName] = element.value;
    }

    for (let index = 0; index < this.scheduleConfig.numberIterator.length; index++) {
      const element = this.scheduleConfig.numberIterator[index];
      message[element.fieldName] = (element.startValue || 0) + element.iteratorValue * iteratorValue;
    }

    for (let index = 0; index < this.scheduleConfig.timeIterator.length; index++) {
      const element = this.scheduleConfig.timeIterator[index];
      const date = element.startValue ? dayjs(element.startValue).utc() : dayjs.utc();

      message[element.fieldName] = date.add(element.iteratorValue * iteratorValue, element.iteratorUnit).format();
    }

    if (this.scheduleConfig.delayTimeInSeconds) {
      await this.sleep(this.scheduleConfig.delayTimeInSeconds);
    }

    return message;
  };

  public run = async () => {
    await this.init();

    let message: any = {};

    if (this.channel) {
      for (let i = 0; i <= this.scheduleConfig.recordsCount; i++) {
        message = await this.generatePayload(i);
        try {
          await this.rabbitConnector.publishMessage(
            this.channel,
            this.scheduleConfig.targetExchange,
            this.scheduleConfig.routingKey,
            JSON.stringify(message),
          );

        console.log('Published message:', message);

        } catch (error) {
          console.log(error)
        }
      }
    }
  };

  private sleep = async (ms: number) => {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  };
}
