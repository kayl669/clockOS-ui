import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {map} from 'rxjs/operators';

import {environment} from '../environments/environment';
import {ICurrentWeather} from './interfaces';

interface ICurrentWeatherData {
  weather: [
    {
      description: string
      id: string
    }
  ];
  main: {
    temp: number
  };
  sys: {
    country: string
  };
  dt: number;
  name: string;
}

export interface IWeatherService {
  getCurrentWeather(city: string, country: string): Observable<ICurrentWeather>;
}

const iconMapping = {
  // Mapping between weather code and weather icon
  // See: http://erikflowers.github.io/weather-icons/
  // See: http://openweathermap.org/weather-conditions
  200: 'wi-thunderstorm',
  201: 'wi-thunderstorm',
  202: 'wi-thunderstorm',
  210: 'wi-thunderstorm',
  211: 'wi-thunderstorm',
  212: 'wi-thunderstorm',
  221: 'wi-thunderstorm',
  230: 'wi-thunderstorm',
  231: 'wi-thunderstorm',
  232: 'wi-thunderstorm',
  300: 'wi-hail',
  301: 'wi-hail',
  302: 'wi-hail',
  310: 'wi-hail',
  311: 'wi-hail',
  312: 'wi-hail',
  313: 'wi-hail',
  314: 'wi-hail',
  321: 'wi-hail',
  500: 'wi-rain',
  501: 'wi-rain',
  502: 'wi-rain',
  503: 'wi-rain',
  504: 'wi-rain',
  511: 'wi-rain',
  521: 'wi-showers',
  522: 'wi-showers',
  531: 'wi-showers',
  701: 'wi-fog',
  711: 'wi-fog',
  721: 'wi-fog',
  731: 'wi-fog',
  741: 'wi-fog',
  751: 'wi-fog',
  761: 'wi-fog',
  762: 'wi-fog',
  771: 'wi-fog',
  781: 'wi-fog',
  800: 'wi-day-sunny',
  801: 'wi-day-sunny-overcast',
  802: 'wi-day-cloudy',
  803: 'wi-day-cloudy',
  804: 'wi-day-cloudy'
};

@Injectable()
export class WeatherService implements IWeatherService {

  constructor(private httpClient: HttpClient) {
  }
  currentWeather = new BehaviorSubject<ICurrentWeather>({
    city: '--',
    country: '--',
    date: Date.now(),
    image: '',
    temperature: 0,
    description: '',
  });

  private static transformToICurrentWeather(data: ICurrentWeatherData): ICurrentWeather {
    return {
      city: data.name,
      country: data.sys.country,
      date: data.dt * 1000,
      image: iconMapping[data.weather[0].id],
      temperature: data.main.temp,
      description: data.weather[0].description,
    };
  }

  updateCurrentWeather(search: string | number, country?: string) {
    this.getCurrentWeather(search, country).subscribe(weather =>
      this.currentWeather.next(weather)
    );
  }

  getCurrentWeather(
    search: string | number,
    country?: string
  ): Observable<ICurrentWeather> {
    let uriParams = '';
    if (typeof search === 'string') {
      uriParams = `q=${search}`;
    } else {
      uriParams = `zip=${search}`;
    }

    if (country) {
      uriParams = `${uriParams},${country}`;
    }

    return this.getCurrentWeatherHelper(uriParams);
  }

  private getCurrentWeatherHelper(uriParams: string): Observable<ICurrentWeather> {
    return this.httpClient
      .get<ICurrentWeatherData>(
        `http://api.openweathermap.org/data/2.5/weather?${uriParams}&appid=${environment.appId}&lang=fr&units=metric`
      )
      .pipe(map(data => WeatherService.transformToICurrentWeather(data)));
  }
}
