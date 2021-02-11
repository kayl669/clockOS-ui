import {EventEmitter, Injectable, Output} from '@angular/core';
import {BehaviorSubject, Observable, Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

export interface StreamState {
    playing: boolean;
    duration: number,
    currentTime: number,
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
        'ended', 'error', 'playing', 'pause', 'timeupdate', 'canplay'
    ];
    private state: StreamState = {
        playing: false,
        duration: undefined,
        currentTime: undefined,
        canplay: false,
        error: false,
    };
    @Output() musicChangeEvent: EventEmitter<any> = new EventEmitter(true);
    @Output() currentPosition: EventEmitter<any> = new EventEmitter(true);

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

    seekTo(position: number) {
        this.audioObj.currentTime = position;
    }

    private stateChange: BehaviorSubject<StreamState> = new BehaviorSubject(this.state);

    private updateStateEvents(event: Event): void {
        switch (event.type) {
            case 'ended':
                this.musicChangeEvent.emit(true);
                break;
            case 'canplay':
                this.state.duration = this.audioObj.duration;
                this.state.canplay = true;
                break;
            case 'playing':
                this.state.playing = true;
                break;
            case 'pause':
                this.state.playing = false;
                break;
            case 'timeupdate':
                this.state.currentTime = this.audioObj.currentTime;
                this.currentPosition.emit({position: this.state.currentTime, total: this.state.duration});
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
            duration: undefined,
            currentTime: undefined,
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

    getDuration() {
        if (this.state.playing) {
            return this.state.duration;
        }
        return -1;
    }
}
