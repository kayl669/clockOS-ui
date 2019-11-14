import {Injectable} from '@angular/core';
import {Observable, Observer, Subject} from 'rxjs';
import {IConfig} from "./interfaces";
import {HttpClient} from "@angular/common/http";
import {mergeMap} from "rxjs/operators";

@Injectable()
export class WebsocketService {
    constructor(private httpClient: HttpClient) {
    }

    private subject: Observable<MessageEvent>;

    public connect(): Observable<MessageEvent> {
        if (!this.subject) {
            this.subject = this.httpClient.get<IConfig>('/config').pipe(mergeMap(data => {
                console.log('Connecting to ' + data.api);
                return this.create(data.api);
            }));
        }
        return this.subject;
    }

    private create(url): Observable<MessageEvent> {
        const ws = new WebSocket(url);

        const observable = new Observable((obs: Observer<MessageEvent>) => {
            ws.onmessage = obs.next.bind(obs);
            ws.onerror = obs.error.bind(obs);
            ws.onclose = obs.complete.bind(obs);
            return ws.close.bind(ws);
        });
        const observer = {
            next: (data: string) => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(data);
                }
            }
        };
        return Subject.create(observer, observable);
    }
}
