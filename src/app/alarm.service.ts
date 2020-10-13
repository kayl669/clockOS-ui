import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable} from 'rxjs';
import {IAlarm} from './interfaces';

@Injectable({
    providedIn: 'root'
})
export class AlarmService {

    constructor(private httpClient: HttpClient) {
    }

    public getAlarm(): Observable<IAlarm> {
        return this.httpClient.get<IAlarm>('/alarm');
    }

    public setAlarm(alarm: IAlarm): Promise<any> {
        console.log('activate ' + alarm.activate);
        console.log('dayOfWeek ' + alarm.dayOfWeek);
        console.log('hour ' + alarm.hour);
        console.log('minute ' + alarm.minute);
        console.log('volume ' + alarm.volume);
        console.log('volumeIncreaseDuration ' + alarm.volumeIncreaseDuration);
        console.log('snoozeAfter ' + alarm.snoozeAfter);
        console.log('type ' + alarm.type);
        console.log('playlist ' + alarm.playlist);
        console.log('stationuuid ' + alarm.stationuuid);
        const headers = new HttpHeaders()
            .set('Content-Type', 'application/json');
        return this.httpClient.post<IAlarm>(`/alarm`, alarm, {headers}).toPromise();
    }

    public stopAlarm() {
        this.httpClient.get<IAlarm>('/stopAlarm?date=' + new Date()).subscribe(data => {
            console.log(data)
        });
    }

    public snoozeAlarm() {
        this.httpClient.get<IAlarm>('/snoozeAlarm?date=' + new Date()).subscribe(data => {
            console.log(data)
        });
    }

    public isAlarmPlaying(): Observable<boolean> {
        return this.httpClient.get<boolean>('/alarmPlaying?date=' + new Date());
    }
}
