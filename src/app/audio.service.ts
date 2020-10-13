import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable, Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

export interface StreamState {
    playing: boolean;
    canplay: boolean;
    error: boolean;
}

// @ts-ignore
@Injectable({
    providedIn: 'root'
})
export class AudioService {
    private stop$ = new Subject();
    private audioObj = new Audio();
    audioEvents = [
    'error', 'playing', 'pause', 'canplay'
    ];
    private state: StreamState = {
        playing: false,
        canplay: false,
        error: false,
    };

    private streamObservable(url) {
        return new Observable(observer => {
            // Play audio
            this.audioObj.src = url;
            this.audioObj.load();
            this.audioObj.play();

            const handler = (event: Event) => {
                this.updateStateEvents(event);
                observer.next(event);
            };

            this.addEvents(this.audioObj, this.audioEvents, handler);
            return () => {
                // Stop Playing
                this.audioObj.pause();
                this.audioObj.currentTime = 0;
                // remove event listeners
                this.removeEvents(this.audioObj, this.audioEvents, handler);
                // reset state
                this.resetState();
            };
        });
    }

    private addEvents(obj, events, handler) {
        events.forEach(event => {
            obj.addEventListener(event, handler);
        });
    }

    private removeEvents(obj, events, handler) {
        events.forEach(event => {
            obj.removeEventListener(event, handler);
        });
    }

    playStream(url) {
        return this.streamObservable(url).pipe(takeUntil(this.stop$)).subscribe();
    }

    setVolume(vol) {
        this.audioObj.volume = vol / 100;
    }

    play() {
        this.audioObj.play();
    }

    pause() {
        this.audioObj.pause();
    }

    stop() {
        this.audioObj.pause();
        this.stop$.next();
    }

    private stateChange: BehaviorSubject<StreamState> = new BehaviorSubject(this.state);

    private updateStateEvents(event: Event): void {
        switch (event.type) {
            case 'canplay':
                this.state.canplay = true;
                break;
            case 'playing':
                this.state.playing = true;
                break;
            case 'pause':
                this.state.playing = false;
                break;
            case 'error':
                this.resetState();
                this.state.error = true;
                break;
            default:
                console.log('not manage ', event.type);
        }
        this.stateChange.next(this.state);
    }

    private resetState() {
        this.state = {
            playing: false,
            canplay: false,
            error: false
        };
    }

    getState(): Observable<StreamState> {
        return this.stateChange.asObservable();
    }

    isPlaying() {
        return this.state.playing;
    }
}
