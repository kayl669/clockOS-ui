import * as io from 'socket.io-client';
import {Injectable} from '@angular/core';
import {ScriptService} from "ngx-script-loader";
import {HttpClient} from "@angular/common/http";
import {IConfig} from "./interfaces";
import DZ = DeezerSdk.DZ;
import LoginResponse = DeezerSdk.LoginResponse;
import PlayerState = DeezerSdk.PlayerState;
import Track = DeezerSdk.Track;
import SdkOptions = DeezerSdk.SdkOptions;

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
    public trackId;
    currentTrack: Track;
    lastPosition = 0; // last position of the track
    musicStatus = 'stop';
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
            this.httpClient.get<IConfig>('/config').toPromise().then(function (data) {
                this.deezerAppId = data.deezerAppId;
                this.server = data.server;
                this.socket = io.connect(data.ws, {rejectUnauthorized: false});
                this.socket.on('connected', (data, identification) => {
                    identification('player');
                });
            }.bind(this)).then((() => {
                return this.scriptService.loadScript('https://e-cdns-files.dzcdn.net/js/min/dz.js').toPromise().then((() => {
                    DZ.init({
                        appId: this.deezerAppId, // Your app id
                        channelUrl: this.server + '/channel.html',
                        player: {
                            onload: ((state: PlayerState) => {
                                DZ.login(((res: LoginResponse) => {
                                    console.log('userID ', res.userID);
                                    console.log('status ', res.status);
                                    console.log('accessToken ', res.authResponse.accessToken);
                                    console.log('expire ', res.authResponse.expire);
                                    if (res.authResponse) {
                                        this.player();
                                        DZ.api('/user/me', ((response) => {
                                            this.connected = true;
                                            myCallback('Welcome ' + response.name, this.socket, DZ);
                                        }).bind(this));
                                    }
                                }).bind(this));
                            }).bind(this)
                        }
                    });
                }).bind(this));
            }).bind(this));
            return;
        }
        DZ.ready(((sdkOptions: SdkOptions) => {
            DZ.api('/user/me', ((response) => {
                myCallback('Already connect ' + response.name, this.socket, DZ);
            }).bind(this));
        }).bind(this));
    }

    updateInfos(data) {
        if ((data.musicStatus === 'playing' || data.musicStatus === 'pause') && data.queue[0]) {
            DZ.api('/track/' + data.queue[0], (response) => {
                this.title = response.title;
                if (response.album != null) {
                    this.cover = response.album.cover_small;
                    this.album = response.album.title;
                } else {
                    this.cover = '';
                    this.album = '';
                }
                if (response.artist != null) {
                    this.artist = response.artist.name;
                } else {
                    this.artist = '';
                }
            });
        } else {
            this.title = '';
            this.cover = '';
            this.artist = '';
            this.album = '';
        }
    }

    player() {
        // Play a track
        this.socket.on('track', (trackId) => {
            console.log('Play track', trackId);

            DZ.player.playTracks([trackId], true, 0, (response) => {
                console.log(response);
                this.trackId = response.tracks[0].id;
                console.log(response.tracks[0].title);
                console.log(response.tracks[0].duration);
                console.log(response.tracks[0].artist.name);
                console.log(response.tracks[0].artist.id);
                console.log(response.tracks[0].album.title);
                console.log(response.tracks[0].album.id);
            });
        });
        this.socket.on('playlist', (playlist) => {
            console.log('playlist ', playlist);
            var tracks = [];
            var shuffledTracks = [];
            DZ.player.playPlaylist(playlist.playlist, false, 0, (response) => {
                for (let i = 0; i < response.tracks.length; i++) {
                    tracks.push(response.tracks[i]);
                }
                while (tracks.length > 0) {
                    const j = Math.floor(Math.random() * (tracks.length - 1));
                    shuffledTracks.push(tracks.splice(j, 1)[0].id);
                }
                DZ.player.playTracks(shuffledTracks, false, 0, (resp) => {
                    console.log("Sending tracks");
                    this.socket.emit('tracks', shuffledTracks);
                });
            });
        });

        // What is the current track
        this.socket.on('isCurrent', () => {
            console.log('isCurrent');
            if (this.currentTrack != null) {
                this.socket.emit('current', {
                    current: this.currentTrack,
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
        this.socket.on('play', () => {
            if (this.musicStatus == 'stop') {
                if (this.queue.length > 0) {
                    // If no track loaded, play the first in the queue
                    DZ.player.playTracks(this.queue[0], true, 0, (response) => {
                        this.queue.splice(0, 1);
                        console.log(response);
                    });
                }
            } else {
                DZ.player.play();
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
            console.log('current_track id           ' + track.track.id);
            console.log('current_track album id     ' + track.track.album.id);
            console.log('current_track album title  ' + track.track.album.title);
            console.log('current_track artist id    ' + track.track.artist.id);
            console.log('current_track artist name  ' + track.track.artist.name);
            console.log('current_track duration     ' + track.track.duration);
            console.log('current_track title        ' + track.track.title);
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
