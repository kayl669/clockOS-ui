export interface ICurrentWeather {
  city: string;
  country: string;
  date: number;
  image: string;
  temperature: number;
  description: string;
}

export interface IAlarm {
  activate: boolean;
  volume: number;
  hour: number;
  minute: number;
  volumeIncreaseDuration: number;
  snoozeAfter: number;
}
