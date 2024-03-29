import { RabbitConnector } from '../rabbitConnector.ts/rabbitConnector';
import { ScheduleConsumer } from '../scheduleConsumer/scheduleConsumer';
import { ScheduleConfig } from '../scheduleConsumer/scheduleConsumer.types';

const example: ScheduleConfig = {
  targetQueue: 'example',
  routingKey: 'example',
  targetExchange: 'example',
  recordsCount: 10,
  delayTimeInSeconds: 5,
  timeIterator: [
    {
      fieldName: 'timeIteratorWithStartValue',
      iteratorValue: 3,
      iteratorUnit: 'hours',
      startValue: '2020-01-01T12:00:00Z',
    },
    {
      fieldName: 'timeIteratorWithOutStartValue',
      iteratorValue: 1,
      iteratorUnit: 'day',
    },
  ],
  numberIterator: [
    {
      fieldName: 'numberIterator',
      iteratorValue: 4,
      startValue: 1,
    },
  ],
  staticFields: [
    {
      fieldName: 'staticField1',
      value: 69,
    },
    {
      fieldName: 'staticField1',
      value: 96,
    },
  ],
  optionField: [],
  uuidGenerator: [],
  conditions: []
};

const exampleRunner = async () => {
  const rabbitConnector = new RabbitConnector('amqp://guest:guest@localhost:5672');

  const connection = await rabbitConnector.connectToRabbit();
  const channel = await rabbitConnector.createChannel(connection);

  if (channel) {
    const scheduleConsumer = new ScheduleConsumer(example, rabbitConnector, channel);

    await scheduleConsumer.run();
  } else {
    console.log("Cannot assign channel");
  }
};

export default exampleRunner;
