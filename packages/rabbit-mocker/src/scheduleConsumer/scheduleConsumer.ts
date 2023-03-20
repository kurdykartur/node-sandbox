import { Channel } from 'amqplib';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { v4 as uuidv4 } from "uuid";
import { RabbitConnector } from '../rabbitConnector.ts/rabbitConnector';
import { ScheduleConfig } from './scheduleConsumer.types';
dayjs.extend(utc);

export class ScheduleConsumer {
  private uuids: string[]
  private channel: Channel;

  constructor (private scheduleConfig: ScheduleConfig, private rabbitConnector: RabbitConnector, channel: Channel) {
    this.scheduleConfig = scheduleConfig;
    this.rabbitConnector = rabbitConnector;
    this.channel = channel;
  }

  private init = async () => {
    this.uuids = new Array(this.scheduleConfig.uuidGeneratorsCount).map(() => { return uuidv4() })
  };

  private generatePayload = async (iteratorValue: number) => {
    const message = {};

    for (let index = 0; index < this.scheduleConfig.uuidGenerator.length; index++) {
      const element = this.scheduleConfig.uuidGenerator[index];
      message[element.fieldName] = this.uuids[element.generatorOrder];
    }

    for (let index = 0; index < this.scheduleConfig.optionField.length; index++) {
      const element = this.scheduleConfig.optionField[index];
      message[element.fieldName] = element.options[this.between(0, element.options.length)];
    }

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

      for (let index = 0; index < this.scheduleConfig.conditions.length; index++) {
        const element = this.scheduleConfig.conditions[index];
        if(message[element.conditionField] === element.conditionValue) {
          message[element.targetField] = element.targetValue
        }
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
            JSON.stringify(message),
            this.scheduleConfig.routingKey
          );

          console.log('Published message:', message);

        } catch (error) {
          console.log(error)
        }
      }
    }
  };

  private sleep = async (ms: number): Promise<void> => {
    return await new Promise(async (resolve) => {
       setTimeout(resolve, ms * 1000);
    });
  };

  private between = (min: number, max: number): number => {
    return Math.floor(
      Math.random() * (max - min) + min
    )
  }
}
