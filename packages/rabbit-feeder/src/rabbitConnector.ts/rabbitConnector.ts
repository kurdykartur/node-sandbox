import amqp from 'amqplib';

export class RabbitConnector {
  constructor(private connectionString: string) {
    this.connectionString = connectionString;
  }

  async connectToRabbit(): Promise<amqp.Connection> {
    console.log('Connecting to RabbitMQ');

    const connection = await amqp.connect(this.connectionString);
    console.log('Connected to RabbitMQ');

    return connection;
  }

  async createChannel(rabbit: amqp.Connection): Promise<amqp.Channel | null> {
    return await rabbit
      .createChannel()
      .then(function (channel) {
        console.log('Channel created');
        return channel;
      })
      .catch(function (exception) {
        console.error('Could not create a channel to RabbitMQ', exception.stack);
        return null;
      });
  }

  async assertExchange(channel: amqp.Channel, exchange: string, exchangeType: string, exchangeOptions?: any) {
    return await channel.assertExchange(exchange, exchangeType || 'direct', exchangeOptions || { durable: true });
  }

  async assertQueue(channel: amqp.Channel, queue: string, queueOptions?: any) {
    return await channel.assertQueue(queue, queueOptions || { durable: false });
  }

  async bindQueueToExchange(channel: amqp.Channel, queue: string, exchange: string, routingKey: string) {
    return await channel.bindQueue(queue, exchange, routingKey || '');
  }

  async publishMessage(
    channel: amqp.Channel,
    exchange: string,
    message: any,
    routingKey: string,
    options?: any,
  ): Promise<boolean> {
    return channel.publish(
      exchange,
      routingKey || '',
      Buffer.from(message),
      options || { persistent: true, mandatory: true },
    );
  }
}
