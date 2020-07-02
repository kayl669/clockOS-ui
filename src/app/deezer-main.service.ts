import * as io from 'socket.io-client';
import {Injectable} from '@angular/core';
import {ScriptService} from "ngx-script-loader";
import {HttpClient} from "@angular/common/http";
import {IConfig, IRadio} from "./interfaces";
import {AudioService} from "./audio.service";
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
    deezerConnected: boolean;
    deezerAppId;
    server;
    socket;
    queue = [];
    trackId;
    stationuuid: string;
    currentTrack: Track;
    lastPosition = 0; // last position of the track
    musicStatus = 'stop';
    title = '';
    artist = '';
    album = '';
    cover = '';

    constructor(private scriptService: ScriptService, private httpClient: HttpClient, private audioService: AudioService) {
        this.connected = false;
        this.deezerConnected = false;
    }

    ensureConnected(callback) {
        let myCallback = callback;
        if (!this.connected) {
            console.log("Connecting to backend");
            this.httpClient.get<IConfig>('/config').toPromise().then(((data) => {
                this.deezerAppId = data.deezerAppId;
                this.server = data.server;
                this.socket = io.connect("/", {rejectUnauthorized: false});
                this.socket.on('connected', ((data, identification) => {
                    identification('player');
                    this.connected = true;
                    this.player();
                    myCallback('Connected as player', this.socket);
                }).bind(this));
            }).bind(this));
            return;
        }
        myCallback('Already as player', this.socket);
    }

    ensureDeezerConnected(callback) {
        let myCallback = callback;
        this.ensureConnected(() => {
            if (!this.deezerConnected) {
                return this.scriptService.loadScript('https://e-cdns-files.dzcdn.net/js/min/dz.js').toPromise().then((() => {
                    console.log("Connecting to deezer");
                    DZ.init({
                        appId: this.deezerAppId, // Your app id
                        channelUrl: this.server + '/channel.html',
                        player: {
                            onload: ((state: PlayerState) => {
                                console.log(state);
                                DZ.login(((res: LoginResponse) => {
                                    console.log('userID ', res.userID);
                                    console.log('status ', res.status);
                                    console.log('accessToken ', res.authResponse.accessToken);
                                    console.log('expire ', res.authResponse.expire);
                                    if (res.authResponse) {
                                        DZ.api('/user/me', ((response) => {
                                            if (!response.name) {
                                                this.disconnect();
                                                return;
                                            }
                                            this.deezerConnected = true;
                                            this.deezerEvent();
                                            myCallback('Welcome ' + response.name, this.socket, DZ);
                                        }).bind(this));
                                    } else {
                                        this.disconnect();
                                    }
                                }).bind(this));
                            }).bind(this)
                        }
                    });
                }).bind(this));
                return;
            }
            DZ.ready(((sdkOptions: SdkOptions) => {
                DZ.api('/user/me', ((response) => {
                    myCallback('Already connect ' + response.name, this.socket, DZ);
                }).bind(this));
            }).bind(this));
        });
    }

    disconnect() {
        if (this.deezerConnected) {
            DZ.logout();
        }
        this.server = null;
        this.socket = null;
        this.connected = false;
        this.deezerConnected = false;
    }

    updateInfos(data) {
        console.log(data);
        this.stationuuid = data.stationuuid;
        if (this.deezerConnected && ((data.musicStatus === 'playing' || data.musicStatus === 'pause') && data.queue[0])) {
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

    playRadio(stationuuid:string) {
        if (this.deezerConnected) {
            DZ.player.pause();
        }
        this.audioService.stop();
        console.log('https://de1.api.radio-browser.info/json/stations/byuuid/' + stationuuid);
        this.httpClient.get<IRadio>('https://de1.api.radio-browser.info/json/stations/byuuid/' + stationuuid).subscribe(data => {
            console.log(data);
            console.log(data[0].stationuuid);
            console.log(data[0].url);
            console.log(data[0].name);
            console.log(data[0].favicon);
            console.log(data[0].tags);
            this.stationuuid = data[0].stationuuid;
            this.audioService.playStream(data[0].url);
            this.title = data[0].name;
            this.artist = 'Radio';
            this.cover = data[0].favicon;
            this.album = data[0].tags;
            this.musicStatus = 'radio';
            this.lastPosition = 0;
        });
    }

    isPlaying() {
        return (this.deezerConnected && DZ.player.isPlaying()) || this.audioService.isPlaying();
    }

    stop() {
        this.socket.emit('stop');
    }

    setVolume(volume: number) {
        if (this.deezerConnected && DZ.player.isPlaying()) {
            DZ.player.setVolume(volume);
        } else if (this.audioService.isPlaying()) {
            this.audioService.setVolume(volume);
        }
    }

    getVolume() {
        if (this.deezerConnected && DZ.player.isPlaying()) {
            return DZ.player.getVolume();
        }
        if (this.audioService.isPlaying()) {
            return this.audioService.getVolume();
        }
        return 0;
    }

    player() {
        // Play a track
        this.socket.on('track', ((trackId) => {
            console.log('Play track', trackId);
            if (!this.deezerConnected) {
                console.log('Cannot play track', trackId, 'not connected');
                return
            }
            DZ.player.playTracks([trackId], true, 0, (response) => {
                console.log(response);
                this.trackId = response.tracks[0].id;
                this.stationuuid = '';
                console.log(response.tracks[0].title);
                console.log(response.tracks[0].duration);
                console.log(response.tracks[0].artist.name);
                console.log(response.tracks[0].artist.id);
                console.log(response.tracks[0].album.title);
                console.log(response.tracks[0].album.id);
            });
        }).bind(this));
        this.socket.on('playlist', ((playlist) => {
            console.log('playlist ', playlist);
            var tracks = [];
            var shuffledTracks = [];
            this.stationuuid = '';
            this.audioService.stop();
            if (!this.deezerConnected) {
                console.log('Cannot play playlist', playlist, 'not connected');
                return
            }
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
        }).bind(this));

        this.socket.on('radio', ((radio) => {
            console.log("Let's play ", radio.stationuuid);
            this.playRadio(radio.stationuuid);
        }).bind(this));

        // What is the current track
        this.socket.on('isCurrent', (() => {
            console.log('isCurrent');
            if (this.currentTrack != null) {
                this.socket.emit('current', {
                    current: this.currentTrack,
                    stationuuid: this.stationuuid,
                    musicStatus: this.musicStatus
                });
            } else {
                this.socket.emit('current', {
                    current: false,
                    stationuuid: this.stationuuid,
                    musicStatus: this.musicStatus
                });
            }
        }).bind(this));

        // Basic Commands

        // Play
        this.socket.on('play', (() => {
            if (this.stationuuid !== '') {
                this.playRadio(this.stationuuid);
            } else {
                this.audioService.stop();
                if (this.musicStatus == 'stop') {
                    if (this.queue.length > 0) {
                        if (!this.deezerConnected) {
                            console.log('Cannot play not connected');
                            return
                        }
                        // If no track loaded, play the first in the queue
                        DZ.player.playTracks(this.queue[0], true, 0, (response) => {
                            this.queue.splice(0, 1);
                            console.log(response);
                        });
                    }
                } else {
                    if (!this.deezerConnected) {
                        console.log('Cannot play not connected');
                        return
                    }
                    DZ.player.play();
                }
            }
        }).bind(this));
        // Pause
        this.socket.on('pause', (() => {
            console.log('pause');
            this.audioService.pause();
            if (this.deezerConnected) {
                DZ.player.pause();
            }
            this.socket.emit('musicStatus', 'pause');
        }).bind(this));
        // Stop
        this.socket.on('stop', (() => {
            console.log('stop');
            if (this.audioService.isPlaying()) {
                this.audioService.stop();
            } else if (this.deezerConnected && DZ.player.isPlaying())
                DZ.player.pause();
            this.musicStatus = 'stop';
            this.socket.emit('musicStatus', 'stop');
        }).bind(this));

        // Volume
        this.socket.on('volume', ((vol) => {
            console.log('volume', vol);
            this.setVolume(vol);
        }).bind(this));

        // Seek
        this.socket.on('seek', ((position) => {
            console.log('seek', position);
            if (this.deezerConnected) {
                DZ.player.seek(position);
            }
        }).bind(this));

        this.socket.on('infos', ((data) => {
            this.updateInfos(data);
        }).bind(this));
    }

    deezerEvent() {
        // Listen for player's events

        // Playing, player_position change, we use it to determine if the track is ended
        DZ.Event.subscribe('player_position', ((time) => {
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
        }).bind(this));

        DZ.Event.subscribe('player_play', (() => {
            this.socket.emit('musicStatus', 'playing');
            this.musicStatus = 'playing';
        }).bind(this));

        DZ.Event.subscribe('player_paused', (() => {
            this.socket.emit('musicStatus', 'pause');
            this.musicStatus = 'pause';
        }).bind(this));

        // Fired when a new track starts
        DZ.Event.subscribe('current_track', ((track) => {
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
        }).bind(this));
    }
}
