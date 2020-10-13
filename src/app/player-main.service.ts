import * as io from 'socket.io-client';
import {EventEmitter, Injectable, Output} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {IRadio} from "./interfaces";
import {AudioService} from "./audio.service";
import {YoutubePlayerService} from "./youtube-player.service";


@Injectable({
    providedIn: 'root'
})
export class PlayerMainService {
    max_results = 50;
    connected: boolean;
    apiLoaded: boolean;
    accessToken: string;
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

    @Output() positionChangedEvent: EventEmitter<any> = new EventEmitter(true);

    constructor(private httpClient: HttpClient, private audioService: AudioService, private youtubePlayerService: YoutubePlayerService) {
        this.connected = false;
        this.apiLoaded = false;
        this.player();
        this.playerEvent();
    }

    async ensurePlayerConnected(): Promise<void> {
        return this.httpClient.get('/accessToken').toPromise().then(((token) => {
            this.accessToken = token;
        }).bind(this));
    }

    isPlayerConnected() {
        return this.accessToken !== "";
    }

    disconnect() {
        this.accessToken = "";
    }

    public searchPlayLists(): Promise<any> {
        return this.ensurePlayerConnected().then(() => {
            return this.httpClient.get('https://www.googleapis.com/youtube/v3/playlists', {
                headers: {
                    'Authorization': 'Bearer ' + this.accessToken,
                    'Accept': 'application/json'
                },
                params: new HttpParams()
                    .set('part', 'snippet,contentDetails')
                    .set('mine', 'true')
                    .set('maxResults', '' + this.max_results)
            }).toPromise().then(response => {
                var res = [];
                for (let i = 0; i < response['items'].length; i++) {
                    const item = response['items'][i];
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
        });
    }

    playRadio(stationuuid: string) {
        this.musicStatus = 'radio';
        this.youtubePlayerService.stopPlayingVideo();
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
        if (this.musicStatus == 'stop' || this.musicStatus == 'radio') {
            if (this.queue.length > 0) {
                // If no track loaded, play the first in the queue
                let track = this.queue[0];
                this.youtubePlayerService.playVideo(track.videoId, track.playlistId, track.title);
                this.title = track.title;
                this.queue.splice(0, 1);
            }
        } else {
            this.youtubePlayerService.playPausedVideo();
        }
    }

    isPlaying() {
        return this.youtubePlayerService.isPlaying() || this.audioService.isPlaying();
    }

    play() {
        this.socket.emit('play');
    }

    private playing() {
        if (this.stationuuid !== '') {
            this.playRadio(this.stationuuid);
        } else {
            this.playMusic();
        }
    }

    pause() {
        console.log("pausing");
        console.log("send pause");
        this.socket.emit('pause');
    }

    private pausing() {
        console.log('pause');
        this.audioService.pause();
        if (this.youtubePlayerService.isPlaying()) {
            this.youtubePlayerService.pausePlayingVideo();
        }
    }

    stop() {
        this.socket.emit('stop');
    }

    private stopping() {
        console.log('stopping');
        if (this.audioService.isPlaying()) {
            this.audioService.stop();
        } else if (this.youtubePlayerService.isPlaying()) {
            this.youtubePlayerService.stopPlayingVideo();
        }
        this.musicStatus = 'stop';
        this.title = '';
    }

    prevTrack() {
        if (this.musicStatus != 'radio')
            this.socket.emit('prevTrack');
    }

    nextTrack() {
        if (this.musicStatus != 'radio')
            this.socket.emit('nextTrack');
    }

    setVolume(volume: number) {
        this.socket.emit('volume', volume);
    }

    seek(seek: number) {
        this.socket.emit('seek', seek);
    }

    playList(playlistId: string) {
        this.ensurePlayerConnected().then(() => {
            console.log('playlist ', playlistId);
            var tracks = [];
            var shuffledTracks = [];
            this.stationuuid = '';
            this.favicon = '';
            this.audioService.stop();
            this.httpClient.get('https://www.googleapis.com/youtube/v3/playlistItems', {
                headers: {
                    'Authorization': 'Bearer ' + this.accessToken,
                    'Accept': 'application/json'
                },
                params: new HttpParams()
                    .set('part', 'snippet')
                    .set('playlistId', playlistId)
                    .set('maxResults', '' + this.max_results)
            }).toPromise().then(response => {
                console.log('response ', response);
                let res = response['items'];
                this.nextToken = response['nextPageToken'] ? response['nextPageToken'] : undefined;
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
                console.log("Sending tracks", shuffledTracks);
                this.socket.emit('tracks', shuffledTracks);
            });
        });
    }

    radio(stationuuid: string) {
        console.log('Sending radio', stationuuid);
        this.socket.emit('radio', {stationuuid: stationuuid});
    }

    player() {
        this.socket = io.connect('/', {rejectUnauthorized: false});

        this.socket.on('connected', ((data, identification) => {
            identification('player');
            this.connected = true;
        }).bind(this));

        this.socket.on('playMusic', () => {
            console.log("Let's play music");
            this.playMusic();
        });

        this.socket.on('playlist', ((playlist) => {
            this.playList(playlist.playlist);
        }).bind(this));

        this.socket.on('radio', ((radio) => {
            console.log("Let's play ", radio.stationuuid);
            this.playRadio(radio.stationuuid);
        }).bind(this));

        this.socket.on('play', (() => {
            this.playing();
        }).bind(this));

        this.socket.on('pause', (() => {
            this.pausing();
            this.socket.emit('musicStatus', 'pause');
        }).bind(this));

        this.socket.on('stop', (() => {
            this.stopping();
            this.socket.emit('musicStatus', 'stop');
        }).bind(this));

        this.socket.on('volume', ((vol) => {
            console.log('volume', vol);
            this.currentVolume = vol;
            if (this.youtubePlayerService.isPlaying()) {
                this.youtubePlayerService.setVolume(vol);
            } else if (this.audioService.isPlaying()) {
                this.audioService.setVolume(vol);
            }
        }).bind(this));

        this.socket.on('seek', ((position) => {
            console.log('seek', position);
            if (this.youtubePlayerService.isPlaying()) {
                this.youtubePlayerService.seekTo(position);
            }
        }).bind(this));

        this.socket.on('clientInfos', ((data) => {
            console.log('clientInfos', data);
            this.queue = data.queue;
            this.musicStatus = data.musicStatus;
            this.stationuuid = data.stationuuid;
            if (data.musicStatus == 'radio') {
                this.playRadio(data.stationuuid);
            }
            if ((data.musicStatus === 'playing' || data.musicStatus === 'pause') && data.queue[0]) {
                this.stopping();
                this.playMusic();
                this.youtubePlayerService.seekTo(data.musicPosition);
                if (data.musicStatus === 'pause')
                    this.youtubePlayerService.pausePlayingVideo();
            }
        }).bind(this));

        this.socket.on('tracks', ((data) => {
            console.log('tracks', data);
            this.queue = data.queue;
            this.musicStatus = data.musicStatus;
            this.stationuuid = data.stationuuid;
            this.stopping();
            this.playMusic();
        }).bind(this));

        this.socket.on('prevTrack', ((data) => {
            console.log('prevTrack', data);
            this.queue = data.queue;
            this.musicStatus = data.musicStatus;
            this.stationuuid = data.stationuuid;
            this.stopping();
            this.playMusic();
        }).bind(this));

        this.socket.on('nextTrack', ((data) => {
            console.log('nextTrack', data);
            this.queue = data.queue;
            this.musicStatus = data.musicStatus;
            this.stationuuid = data.stationuuid;
            this.stopping();
            this.playMusic();
        }).bind(this));

        this.socket.on('end', ((data) => {
            console.log('end', data);
            this.queue = data.queue;
            this.musicStatus = data.musicStatus;
            this.stationuuid = data.stationuuid;
            this.stopping();
            this.playMusic();
        }).bind(this));

        this.socket.on('musicPosition', (position) => {
            this.positionChangedEvent.emit(position);
        })
    }

    playerEvent() {
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
