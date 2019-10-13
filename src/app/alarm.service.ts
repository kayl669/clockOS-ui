import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable} from 'rxjs';
import {IAlarm} from './interfaces';
import {environment} from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AlarmService {

  constructor(private httpClient: HttpClient) {
  }

  public getAlarm(): Observable<IAlarm> {
    return this.httpClient.get<IAlarm>(environment.backUrl + '/alarm');
  }

  public setAlarm(alarm: IAlarm) {
    console.log('alarm ' + alarm);
    const headers = new HttpHeaders()
      .set('Content-Type', 'application/json');
    this.httpClient.post<IAlarm>(`${environment.backUrl}/alarm`, alarm, {headers}).subscribe(res => console.log(res));
  }

  public stopAlarm() {
    this.httpClient.get<IAlarm>(environment.backUrl + '/stopAlarm').subscribe();
  }

  public snoozeAlarm() {
    this.httpClient.get<IAlarm>(environment.backUrl + '/snoozeAlarm').subscribe();
  }
}
