import * as io from 'socket.io-client';
import {Injectable} from '@angular/core';
import {ScriptService} from "ngx-script-loader";
import {HttpClient} from "@angular/common/http";
import {IConfig} from "./interfaces";
import DZ = DeezerSdk.DZ;
import LoginResponse = DeezerSdk.LoginResponse;
import PlayerState = DeezerSdk.PlayerState;

// @ts-ignore
@Injectable()
export class DeezerMainService {
    connected: boolean;
    deezerAppId;
    server;
    socket;
    queue = [];
    track;
    currentTrack = {
        id: '' // current track if
    };
    lastPosition = 0; // last position of the track
    musicMode = 'track';
    musicStatus = 'stop';

    constructor(private scriptService: ScriptService, private httpClient: HttpClient) {
        this.connected = false;
    }

    ensureConnected(resolve) {
        let myResolve = resolve;
        if (!this.connected) {
            console.log("init deezer main");
            return this.httpClient.get<IConfig>('/config').toPromise().then(function (data) {
                this.deezerAppId = data.deezerAppId;
                this.server = data.server;
                this.socket = io.connect(this.server, {rejectUnauthorized: false});
                this.socket.on('connected', (data, identification) => {
                    console.log('connnected to backend');
                    console.log(data);
                    identification('player');
                });
            }.bind(this)).then((() => {
                return this.scriptService.loadScript('https://e-cdns-files.dzcdn.net/js/min/dz.js').toPromise().then((() => {
                    DZ.init({
                        appId: this.deezerAppId, // Your app id
                        channelUrl: this.server + '/channel.html',
                        player: {
                            onload: function (state: PlayerState) {
                                console.log('Deezer ready');
                                console.log(state);

                                DZ.login(function (res: LoginResponse) {
                                    console.log(res);
                                    if (res.authResponse) {
                                        this.player();
                                        myResolve('say hello to deezer', this.socket, res.authResponse.accessToken);
                                    }
                                }.bind(this));
                                console.log('Deezer done');
                            }.bind(this)
                        }
                    });
                }).bind(this));
            }).bind(this));
        }
        return new Promise<void>(((resolve) => resolve('Already connect', this.socket, '')).bind(this));
    }

    deezerLogin(res: LoginResponse) {
        console.log('deezerLogin');
        if (res.authResponse) {
            this.player();
        }
    }

    deezerReady(state: PlayerState) {
        console.log('Deezer ready');
        console.log(state);

        DZ.login(this.deezerLogin.bind(this));
        console.log('Deezer done');
    }

    player() {
        // Play a track
        this.socket.on('track', (track) => {
            console.log('Play track', track);
            this.track = track;
            DZ.player.playTracks([track], true, 0, (response) => {
                console.log(response);
            });
            this.musicMode = 'track';
        });

        // Play a smartRadio
        this.socket.on('smartRadio', (artist) => {
            console.log('smartRadio ', artist);
            DZ.player.playSmartRadio(artist, 'artist', (response) => {
                console.log('track list', response.tracks);
            });
            this.musicMode = 'radio';
        });

        // Play a radio
        this.socket.on('radio', (radio) => {
            console.log('radio ', radio);
            DZ.player.playRadio(radio, 'radio', true, 20, (response) => {
                console.log('track list', response.tracks);
            });
            this.musicMode = 'radio';
        });

        // What is the current track
        this.socket.on('isCurrent', () => {
            console.log('isCurrent');
            if (this.currentTrack.id !== '') {
                this.socket.emit('current', {
                    current: this.track.track.id,
                    musicStatus: this.musicStatus
                });
            } else {
                this.socket.emit('current', {
                    current: false,
                    musicStatus: this.musicStatus
                });
            }
        });

        // Basic Commands

        // Play
        this.socket.on('play', (track) => {
            console.log('play', track);
            this.track = track;
            DZ.player.play();

            // If no track loaded, play the first in the queue
            if (this.currentTrack.id === '') {
                DZ.player.playTracks(this.queue[0], true, 0, (response) => {
                    console.log(response);
                });
            }
        });
        // Pause
        this.socket.on('pause', () => {
            console.log('pause');
            DZ.player.pause();
            this.socket.emit('musicStatus', 'pause');
        });
        // Stop
        this.socket.on('stop', () => {
            console.log('stop');
            DZ.player.pause();
            this.musicStatus = 'stop';
            this.socket.emit('musicStatus', 'stop');
        });

        // Prev
        this.socket.on('prev', (track) => {
            console.log('prev', track);
            DZ.player.prev();
        });
        // Next
        this.socket.on('next', (track) => {
            console.log('next', track);
            DZ.player.next();
        });

        // Volume
        this.socket.on('volume', (vol) => {
            console.log('volume', vol);
            DZ.player.setVolume(vol);
        });

        // Seek
        this.socket.on('seek', (position) => {
            console.log('seek', position);
            DZ.player.seek(position);
        });

        // Listen for player's events

        // Playing, player_position change, we use it to determine if the track is ended
        DZ.Event.subscribe('player_position', (time) => {
            /**
             * time = [currentTime, totalTime];
             */

            this.socket.emit('musicPosition', time[0] / time[1] * 100); // From 0 to 100

            if (time[0] < this.lastPosition) { // return to position 0
                // if musicMode == 'track', the server will return the next track to play
                this.socket.emit('end', this.currentTrack.id);
                this.socket.emit('musicStatus', 'stop');
                this.musicStatus = 'stop';
            }

            this.lastPosition = time[0];
        });

        DZ.Event.subscribe('player_play', () => {
            this.socket.emit('musicStatus', 'playing');
            this.musicStatus = 'playing';
        });

        DZ.Event.subscribe('player_paused', () => {
            this.socket.emit('musicStatus', 'pause');
            this.musicStatus = 'pause';
        });

        // Fired when a new track starts
        DZ.Event.subscribe('current_track', (track) => {
            this.socket.emit('current', {
                current: track.track.id,
                musicStatus: this.musicStatus
            });
            this.currentTrack = track.track;
        });
    }

}
