import * as io from 'socket.io-client';
import {Injectable} from '@angular/core';
import {ScriptService} from "ngx-script-loader";
import {HttpClient} from "@angular/common/http";
import {IConfig} from "./interfaces";
import DZ = DeezerSdk.DZ;
import LoginResponse = DeezerSdk.LoginResponse;
import PlayerState = DeezerSdk.PlayerState;

// @ts-ignore
@Injectable({
    providedIn: 'root',
})
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
    myDZ;
    visibleInfo = false;
    title = '';
    artist = '';
    album = '';
    cover = '';

    constructor(private scriptService: ScriptService, private httpClient: HttpClient) {
        this.connected = false;
    }

    ensureConnected(callback) {
        let myCallback = callback;
        if (!this.connected) {
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
                    this.myDZ = DZ;
                    this.myDZ.init({
                        appId: this.deezerAppId, // Your app id
                        channelUrl: this.server + '/channel.html',
                        player: {
                            onload: ((state: PlayerState) => {
                                console.log(state);

                                this.myDZ.login(((res: LoginResponse) => {
                                    console.log(res);
                                    if (res.authResponse) {
                                        this.player();
                                        this.myDZ.api('/user/me', ((response) => {
                                            this.connected = true;
                                            myCallback('Welcome ' + response.name, this.socket, this.myDZ);
                                        }).bind(this));
                                    }
                                }).bind(this));
                            }).bind(this)
                        }
                    });
                }).bind(this));
            }).bind(this)).finally(() => console.log('Fini'));
        }
        return new Promise<void>((() => {
            console.log('Already connect');
            this.myDZ.api('/user/me', ((response) => {
                myCallback('Already connect ' + response.name, this.socket, this.myDZ);
            }).bind(this));
        }).bind(this));
    }

    updateInfos(data) {
        if ((data.musicStatus === 'playing' || data.musicStatus === 'pause') && data.queue[0]) {
            this.myDZ.api('/track/' + data.queue[0], (response) => {
                this.visibleInfo = true;
                this.title = response.title;
                this.cover = response.album.cover_small;
                this.artist = response.artist.name;
                this.album = response.album.title;
            });
        } else {
            this.visibleInfo = false;
            this.title = '';
            this.cover = '';
            this.artist = '';
            this.album = '';
        }
    }

    player() {
        // Play a track
        this.socket.on('track', (track) => {
            console.log('Play track', track);
            this.track = track;
            this.myDZ.player.playTracks([track], true, 0, (response) => {
                console.log(response);
            });
            this.musicMode = 'track';
        });

        // Play a smartRadio
        this.socket.on('smartRadio', (artist) => {
            console.log('smartRadio ', artist);
            this.myDZ.player.playSmartRadio(artist, 'artist', (response) => {
                console.log('track list', response.tracks);
            });
            this.musicMode = 'radio';
        });

        // Play a radio
        this.socket.on('radio', (radio) => {
            console.log('radio ', radio);
            this.myDZ.player.playRadio(radio, 'radio', true, 20, (response) => {
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
            this.myDZ.player.play();

            // If no track loaded, play the first in the queue
            if (this.currentTrack.id === '') {
                this.myDZ.player.playTracks(this.queue[0], true, 0, (response) => {
                    console.log(response);
                });
            }
        });
        // Pause
        this.socket.on('pause', () => {
            console.log('pause');
            this.myDZ.player.pause();
            this.socket.emit('musicStatus', 'pause');
        });
        // Stop
        this.socket.on('stop', () => {
            console.log('stop');
            this.myDZ.player.pause();
            this.musicStatus = 'stop';
            this.socket.emit('musicStatus', 'stop');
        });

        // Prev
        this.socket.on('prev', (track) => {
            console.log('prev', track);
            this.myDZ.player.prev();
        });
        // Next
        this.socket.on('next', (track) => {
            console.log('next', track);
            this.myDZ.player.next();
        });

        // Volume
        this.socket.on('volume', (vol) => {
            console.log('volume', vol);
            this.myDZ.player.setVolume(vol);
        });

        // Seek
        this.socket.on('seek', (position) => {
            console.log('seek', position);
            this.myDZ.player.seek(position);
        });

        // Listen for player's events

        // Playing, player_position change, we use it to determine if the track is ended
        this.myDZ.Event.subscribe('player_position', (time) => {
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

        this.myDZ.Event.subscribe('player_play', () => {
            this.socket.emit('musicStatus', 'playing');
            this.musicStatus = 'playing';
        });

        this.myDZ.Event.subscribe('player_paused', () => {
            this.socket.emit('musicStatus', 'pause');
            this.musicStatus = 'pause';
        });

        // Fired when a new track starts
        this.myDZ.Event.subscribe('current_track', (track) => {
            this.socket.emit('current', {
                current: track.track.id,
                musicStatus: this.musicStatus
            });
            this.currentTrack = track.track;
        });
        this.socket.on('infos', ((data) => {
            this.updateInfos(data);
        }).bind(this));
    }
}
