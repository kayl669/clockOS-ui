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
    playlist: number;
}

export interface ICity {
    city: string;
}

export interface IConfig {
    api: string;
    openWeatherAppId: string;
    deezerAppId: string;
    server: string;
    ws: string;
}

export interface IWifiScan {
    bssid: string,
    signalLevel: number,
    ssid: string
}

export interface IWifiConnect {
    ssid: string,
    psk: string
}

export interface IRadio {
    url: string,
    name: string,
    favicon: string
}
