import { ManipulateType } from 'dayjs';

export type ScheduleConfig = {
  targetQueue: string;
  routingKey: string;
  targetExchange: string;
  recordsCount: number; // default 1
  delayTimeInSeconds?: number;
  timeIterator: {
    fieldName: string;
    iteratorValue: number; // example 10, 20
    iteratorUnit: ManipulateType; // example "millisecond" | "second" | "minute" | "hour" | "day" | "month" | "year" | "milliseconds" | "seconds" | "minutes" | "hours" | "days" | "months" | "years"
    startValue?: string; // default timestamp on script run
  }[];
  numberIterator: {
    fieldName: string;
    iteratorValue: number; // example 5, 10, 15
    startValue?: number; // default 0
  }[];
  staticFields: {
    fieldName: string;
    value: string | number | null;
  }[];
};
