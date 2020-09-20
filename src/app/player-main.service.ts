import * as io from 'socket.io-client';
import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {IConfig, IRadio} from "./interfaces";
import {AudioService} from "./audio.service";
import {YoutubePlayerService} from "./youtube-player.service";


@Injectable()
export class PlayerMainService {
    max_results = 50;
    connected: boolean;
    playerConnected: boolean;
    youtubeApiKey: string;
    clientId: string;
    server;
    socket;
    queue = [];
    stationuuid: string;
    currentTrack;
    lastPosition = 0; // last position of the track
    musicStatus = 'stop';
    title: string = '';
    favicon: string = '';
    currentVolume = -1;

    public nextToken: string;
    public lastQuery: string;
    public gapiSetup: boolean = false; // marks if the gapi library has been loaded
    public authInstance: gapi.auth2.GoogleAuth;
    public user: gapi.auth2.GoogleUser;

    constructor(private httpClient: HttpClient, private audioService: AudioService, private youtubePlayerService: YoutubePlayerService) {
        this.connected = false;
        this.playerConnected = false;
    }

    ensureConnected(callback) {
        let myCallback = callback;
        if (!this.connected) {
            console.log("Connecting to backend");
            this.httpClient.get<IConfig>('/config').toPromise().then(((data) => {
                this.youtubeApiKey = data.youtubeApiKey;
                this.clientId = data.clientId;
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

    async ensurePlayerConnected(callback) {
        let myCallback = callback;
        this.ensureConnected(async () => {
            if (!this.playerConnected) {
                if (await this.checkIfUserAuthenticated()) {

                    this.user = this.authInstance.currentUser.get();
                } else {
                    console.log("Connecting to Youtube");
                    await this.authenticate();
                }
                this.playerConnected = true;
                this.playerEvent();
                myCallback('Welcome ' + this.user.getBasicProfile().getGivenName(), this.socket);
                return;
            }
            myCallback('Already connect ' + this.user.getBasicProfile().getGivenName(), this.socket);
        });
    }

    disconnect() {
        this.server = null;
        this.socket = null;
        this.connected = false;
        this.playerConnected = false;
    }

    async initGoogleAuth(): Promise<void> {
        // When the first promise resolves, it means we have gapi
        // loaded and that we can call gapi.init
        return new Promise((resolve) => {
            gapi.load('auth2', resolve);
            gapi.load('client', resolve);
        }).then((async () => {
            let params = {
                apiKey: this.youtubeApiKey,
                clientId: this.clientId,
                fetch_basic_profile: true,
                scope: 'profile'
            };
            await gapi.auth2
                .init(params)
                .then(auth => {
                    this.gapiSetup = true;
                    this.authInstance = auth;
                });
            gapi.client.setApiKey(this.youtubeApiKey);
            await gapi.client.load("https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest", "v3").then(async () => {
                console.log("GAPI client loaded for API");
            });
        }).bind(this));
    }

    async authenticate() {
        // Initialize gapi if not done yet
        if (!this.gapiSetup) {
            await this.initGoogleAuth();
        }
        console.log("authenticating");
        return this.authInstance.signIn({scope: "https://www.googleapis.com/auth/youtube.readonly"}).then(user => {
            this.user = user;
            console.log('Hello', user.getBasicProfile().getGivenName());
        }, (error) => {
            console.log("Oups", error);
        });
    }

    async checkIfUserAuthenticated(): Promise<boolean> {
        // Initialize gapi if not done yet
        if (!this.gapiSetup) {
            await this.initGoogleAuth();
        }
        let b = this.authInstance.isSignedIn.get();
        console.log("checkIfUserAuthenticated", b);
        return b;
    }

    public async searchPlayLists(): Promise<any> {
        if (await this.checkIfUserAuthenticated()) {
            await this.authenticate();
        }

        return gapi.client.request({
            path: '/youtube/v3/playlists', params: {
                'part': 'snippet,contentDetails',
                'mine': 'true', 'maxResults': this.max_results
            }
        })
            .then(response => {
                var res = [];
                for (let i = 0; i < response.result['items'].length; i++) {
                    const item = response.result['items'][i];
                    res.push({
                        id: item.id,
                        details: {
                            title: item.snippet.title,
                            picture: item.snippet.thumbnails.default.url
                        },
                        nb_tracks: item.contentDetails.itemCount
                    });
                }
                console.log('res', res);
                return res;
            });
    }

    updateInfos(data) {
        console.log('updateInfos', data);
        this.queue = data.queue;
        if (this.musicStatus != data.musicStatus) {
            console.log("Update status", this.musicStatus, data.musicStatus);
            if (data.musicStatus == 'radio') {
                this.playRadio(data.stationuuid);
            }
            if (this.playerConnected && ((data.musicStatus === 'playing' || data.musicStatus === 'pause') && data.queue[0])) {
                this.playMusic();
                this.youtubePlayerService.seekTo(data.musicPosition);
                if (data.musicStatus === 'pause')
                    this.youtubePlayerService.pausePlayingVideo();
            } else
                console.log("Not connected yet");
        }
    }

    playRadio(stationuuid: string) {
        this.musicStatus = 'radio';
        this.youtubePlayerService.stopPlayingVideo();
        this.audioService.stop();
        console.log('https://de1.api.radio-browser.info/json/stations/byuuid/' + stationuuid);
        this.httpClient.get<IRadio>('https://de1.api.radio-browser.info/json/stations/byuuid/' + stationuuid).subscribe(data => {
            console.log(data[0].url);
            this.stationuuid = data[0].stationuuid;
            this.audioService.playStream(data[0].url);
            if (this.currentVolume >= 0)
                this.audioService.setVolume(this.currentVolume);
            this.title = data[0].name;
            this.favicon = data[0].favicon;
            this.lastPosition = 0;
        });
    }

    playMusic() {
        this.audioService.stop();
        if (this.musicStatus == 'stop') {
            if (this.queue.length > 0) {
                if (!this.playerConnected) {
                    console.log('Cannot play not connected');
                    return
                }
                // If no track loaded, play the first in the queue
                let track = this.queue[0];
                this.youtubePlayerService.playVideo(track.videoId, track.playListId, track.title);
                this.title = track.title;
                this.queue.splice(0, 1);
            }
        } else {
            if (!this.playerConnected) {
                console.log('Cannot play not connected');
                return
            }
            this.youtubePlayerService.playPausedVideo();
        }
    }

    isPlaying() {
        return (this.playerConnected && this.youtubePlayerService.isPlaying()) || this.audioService.isPlaying();
    }

    stop() {
        this.socket.emit('stop');
    }

    setVolume(volume: number) {
        this.currentVolume = volume;
        if (this.playerConnected && this.youtubePlayerService.isPlaying()) {
            this.youtubePlayerService.setVolume(volume);
        } else if (this.audioService.isPlaying()) {
            this.audioService.setVolume(volume);
        }
    }

    getVolume() {
        if (this.playerConnected && this.youtubePlayerService.isPlaying()) {
            return this.youtubePlayerService.getVolume();
        }
        if (this.audioService.isPlaying()) {
            return this.audioService.getVolume();
        }
        return this.currentVolume;
    }

    player() {
        // Play a track
        this.socket.on('track', ((track) => {
            console.log('Play track', track);
            if (track == null)
                return;
            if (!this.playerConnected) {
                console.log('Cannot play track', track, 'not connected');
                return;
            }
            this.stationuuid = '';
            this.favicon = '';
            this.youtubePlayerService.playVideo(track.videoId, track.playlistId, track.title);
            this.title = track.title;
            if (this.currentVolume >= 0)
                this.youtubePlayerService.setVolume(this.currentVolume);
        }).bind(this));
        this.socket.on('playlist', ((playlist) => {
            console.log('playlist ', playlist.playlist);
            var tracks = [];
            var shuffledTracks = [];
            this.stationuuid = '';
            this.favicon = '';
            this.audioService.stop();
            if (!this.playerConnected) {
                console.log('Cannot play playlist', playlist, 'not connected');
                return;
            }
            gapi.client.request({
                path: '/youtube/v3/playlistItems', params: {
                    'part': 'snippet',
                    'playlistId': playlist.playlist, 'maxResults': this.max_results
                }
            })
                .then(response => {
                    console.log('response ', response.result);
                    let res = response.result['items'];
                    this.nextToken = response.result['nextPageToken'] ? response.result['nextPageToken'] : undefined;
                    for (let i = 0; i < res.length; i++) {
                        tracks.push({
                            videoId: res[i].snippet.resourceId.videoId,
                            playlistId: res[i].snippet.playlistId,
                            title: res[i].snippet.title
                        });
                    }
                    while (tracks.length > 0) {
                        const j = Math.floor(Math.random() * (tracks.length - 1));
                        shuffledTracks.push(tracks.splice(j, 1)[0]);
                    }
                    this.title = shuffledTracks[0].title;
                    console.log("Sending tracks");
                    this.socket.emit('tracks', shuffledTracks);
                });

        }).bind(this));

        this.socket.on('radio', ((radio) => {
            console.log("Let's play ", radio.stationuuid);
            this.playRadio(radio.stationuuid);
        }).bind(this));


        // Basic Commands

        // Play
        this.socket.on('play', (() => {
            if (this.stationuuid !== '') {
                this.playRadio(this.stationuuid);
            } else {
                this.playMusic();
            }
        }).bind(this));
        // Pause
        this.socket.on('pause', (() => {
            console.log('pause');
            this.audioService.pause();
            if (this.playerConnected && this.youtubePlayerService.isPlaying()) {
                this.youtubePlayerService.pausePlayingVideo();
            }
            this.socket.emit('musicStatus', 'pause');
        }).bind(this));
        // Stop
        this.socket.on('stop', (() => {
            console.log('stop');
            if (this.audioService.isPlaying()) {
                this.audioService.stop();
            } else if (this.playerConnected && this.youtubePlayerService.isPlaying())
                this.youtubePlayerService.stopPlayingVideo();
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
            if (this.playerConnected && this.youtubePlayerService.isPlaying()) {
                this.youtubePlayerService.seekTo(position);
            }
        }).bind(this));

        this.socket.on('infos', ((data) => {
            this.updateInfos(data);
        }).bind(this));
    }

    playerEvent() {
        // Listen for player's events

        // Playing, player_position change, we use it to determine if the track is ended
        this.youtubePlayerService.currentPosition.subscribe(((event) => {
            let position = event.position;
            let total = event.total;
            this.socket.emit('musicPosition', position / total * 100); // From 0 to 100
            this.lastPosition = position;
        }).bind(this));
        this.youtubePlayerService.playPauseEvent.subscribe(((event) => {
            if (event == 'play') {
                this.socket.emit('musicStatus', 'playing');
                this.musicStatus = 'playing';
            } else if (event == 'pause') {
                this.socket.emit('musicStatus', 'pause');
                this.musicStatus = 'pause';
            }
        }).bind(this));
        this.youtubePlayerService.videoChangeEvent.subscribe(((event) => {
            console.log("videoChangeEvent", this.currentTrack, event);
            this.socket.emit('end', this.currentTrack);
            this.socket.emit('musicStatus', 'stop');
            this.musicStatus = 'stop';
        }).bind(this));
        this.youtubePlayerService.currentTrack.subscribe(((event) => {
            this.currentTrack = event;
        }).bind(this));
    }
}
