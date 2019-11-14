import {AfterViewInit, Component, OnInit} from '@angular/core';
import {ScriptService} from 'ngx-script-loader';
import * as io from 'socket.io-client';
import {HttpClient} from "@angular/common/http";
import {IConfig} from "../interfaces";
import DZ = DeezerSdk.DZ;
import LoginResponse = DeezerSdk.LoginResponse;


@Component({
    selector: 'app-deezer',
    templateUrl: './deezer.component.html',
    styleUrls: ['./deezer.component.scss']
})
export class DeezerComponent implements AfterViewInit, OnInit {
    deezerAppId;
    server;
    socket;
    queue = [];
    visibleInfo = false;
    title = '';
    artist = '';
    album = '';
    cover = '';
    track;
    position;
    currentTrack = {
        id: '' // current track if
    };
    lastPosition = 0; // last position of the track
    musicMode = 'track';
    musicStatus = 'stop';


    constructor(private scriptService: ScriptService, private httpClient: HttpClient) {
    }

    ngOnInit(): void {
        this.httpClient.get<IConfig>('/config').subscribe(data => {
            this.deezerAppId = data.deezerAppId;
            this.server = data.server;
        });
    }

    ngAfterViewInit(): void {
        this.scriptService.loadScript('https://e-cdns-files.dzcdn.net/js/min/dz.js').subscribe(() => {
            DZ.init({
                appId: this.deezerAppId, // Your app id
                channelUrl: this.server + '/remote/channel.html',
                player: {
                    onload: this.deezerReady.bind(this)
                }
            });
        });
    }

    deezerLogin(res: LoginResponse) {
        console.log('deezerLogin');
        console.log(res);
        if (res.authResponse) {
            this.socket = io.connect(this.server, {rejectUnauthorized: false});
            this.socket.on('connected', (data, identification) => {
                console.log(data);
                identification('player');
            });
            this.player();
        }

    }

    deezerReady(state) {
        console.log('Deezer ready');
        console.log(state);

        DZ.login(this.deezerLogin.bind(this));
        console.log('Deezer done');
    }

    private updatePosition(position) {
        this.position = position;
    }

    private updateInfos(data) {
        if ((data.musicStatus === 'playing' || data.musicStatus === 'pause') && data.queue[0]) {
            DZ.api('/track/' + data.queue[0], (response) => {
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

    /**
     * player method
     *
     * Listen the server and control the Deezer player
     *
     * @return void
     */
    player() {
        // What to play ?

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
        this.socket.on('pause', (track) => {
            console.log('pause', track);
            DZ.player.pause();
            this.socket.emit('musicStatus', 'pause');
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

        this.socket.on('infos', (data) => {
            this.updateInfos(data);
        });

        this.socket.on('musicPosition', (position) => {
            this.updatePosition(position);
        });
    }
}
