import {EventEmitter, Injectable, NgZone, Output} from '@angular/core';
import {ReplaySubject} from "rxjs";
import PlayerState = YT.PlayerState;
import IvLoadPolicy = YT.IvLoadPolicy;
import RelatedVideos = YT.RelatedVideos;
import Controls = YT.Controls;
import KeyboardControls = YT.KeyboardControls;
import ShowInfo = YT.ShowInfo;
import FullscreenButton = YT.FullscreenButton;
import ModestBranding = YT.ModestBranding;
import VideoByIdSettings = YT.VideoByIdSettings;

export interface VideoAndPlaylistSettings extends VideoByIdSettings {
    playlistId: string;
}

export interface IPlayerOutputs {
    ready?: EventEmitter<YT.Player>;
    change?: EventEmitter<YT.PlayerEvent>;
}

@Injectable({
    providedIn: 'root'
})
export class YoutubePlayerService {
    api: ReplaySubject<YT.Player>;
    private ytPlayer: YT.Player = null;
    private ytApiLoaded = false;
    private ytPlayerLoaded = false;

    private currentVideoId: string;
    private currentPlaylistId: string;
    private currentVideoText: string;

    @Output() videoChangeEvent: EventEmitter<any> = new EventEmitter(true);
    @Output() playPauseEvent: EventEmitter<any> = new EventEmitter(true);
    @Output() currentPosition: EventEmitter<any> = new EventEmitter(true);
    @Output() currentTrack: EventEmitter<any> = new EventEmitter(true);

    constructor(private zone: NgZone) {
        this.api = new ReplaySubject(1);
        window['onYouTubeIframeAPIReady'] = (() => {
            if (window) {
                this.api.next(window['YT']);
            }
        }).bind(this);
    }

    loadPlayerApi(htmlId: string) {
        if (!this.ytApiLoaded) {
            this.ytApiLoaded = true;
            const playerApiScript = window.document.createElement('script');
            playerApiScript.type = 'text/javascript';
            playerApiScript.src = `http://www.youtube.com/iframe_api`;
            window.document.body.appendChild(playerApiScript);
        }
        this.api.subscribe(() => {
            if (window['YT'].Player) {
                this.ytPlayerLoaded = false;
                new window['YT'].Player(htmlId, {
                    height: 160,
                    width: 160,
                    events: {
                        onReady: ((ev: YT.PlayerEvent) => {
                            this.zone.run((() => {
                                this.ytPlayerLoaded = true;
                                this.ytPlayer = ev.target;
                            }).bind(this));
                        }).bind(this),
                        onStateChange: (ev: YT.OnStateChangeEvent) => {
                            this.zone.run((() => this.onPlayerStateChange(ev)).bind(this));
                        }
                    },
                    playerVars: {
                        iv_load_policy: IvLoadPolicy.Hide,
                        rel: RelatedVideos.Hide,
                        controls: Controls.Hide,
                        disablekb: KeyboardControls.Disable,
                        showinfo: ShowInfo.Hide,
                        fs: FullscreenButton.Hide,
                        modestbranding: ModestBranding.Modest
                    }
                });
            }
        });
    }

    onPlayerStateChange(event: YT.OnStateChangeEvent) {
        const state = event.data;
        switch (state) {
            case PlayerState.ENDED:
                this.videoChangeEvent.emit(true);
                this.playPauseEvent.emit('stop');
                break;
            case PlayerState.PLAYING:
                this.updateBar();
                this.playPauseEvent.emit('play');
                break;
            case PlayerState.PAUSED:
                this.playPauseEvent.emit('pause');
                break;
        }
    }

    updateBar() {
        if (this.ytPlayer && this.ytPlayerLoaded && this.ytPlayer.getPlayerState) {
            this.currentPosition.emit({position: this.ytPlayer.getCurrentTime(), total: this.ytPlayer.getDuration()});
            setTimeout((this.updateBar).bind(this), 1000);
        }
    }

    async playVideo(videoId: string, playlistId: string, videoText: string): Promise<void> {
        this.currentVideoId = videoId;
        this.currentPlaylistId = playlistId;
        this.currentVideoText = videoText;
        console.log("Try to read ", this.currentVideoId, ' playlistId ', this.currentPlaylistId, this.currentVideoText);
        while (!(this.ytPlayer && this.ytPlayerLoaded && this.ytPlayer.getPlayerState)) {
            await new Promise(resolve => {
                setTimeout(() => {
                    resolve();
                }, 1000);
            });
        }
        console.log("Reading ", this.currentVideoId, ' playlistId ', this.currentPlaylistId, this.currentVideoText);
        let videoId1: VideoAndPlaylistSettings = {videoId: videoId, playlistId: this.currentPlaylistId, suggestedQuality: "small"};
        this.ytPlayer.loadVideoById(videoId1);
        this.currentTrack.emit({
            videoId: this.currentVideoId,
            playlistId: this.currentPlaylistId,
            title: this.currentVideoText
        });
    }

    pausePlayingVideo(): void {
        if (this.ytPlayer && this.ytPlayer.getPlayerState) {
            this.ytPlayer.pauseVideo();
        }
    }

    stopPlayingVideo(): void {
        this.currentVideoId = '';
        this.currentPlaylistId = '';
        this.currentVideoText = '';
        if (this.ytPlayer && this.ytPlayer.getPlayerState) {
            this.ytPlayer.stopVideo();
        }
    }

    playPausedVideo(): void {
        if (this.ytPlayer && this.ytPlayer.getPlayerState) {
            this.ytPlayer.playVideo();
        }
    }

    resizePlayer(width: number, height: number) {
        if (this.ytPlayer && this.ytPlayer.getPlayerState) {
            this.ytPlayer.setSize(width, height);
        }
    }

    setVolume(volume: number) {
        if (this.ytPlayer && this.ytPlayer.getPlayerState) {
            this.ytPlayer.setVolume(volume);
        }
    }
    seekTo(position: number) {
        if (this.ytPlayer && this.ytPlayer.getPlayerState) {
            this.ytPlayer.seekTo(position, true);
        }
    }

    isPlaying() {
        // because YT is not loaded yet 1 is used - YT.PlayerState.PLAYING
        return this.ytPlayer && this.ytPlayer.getPlayerState && (this.ytPlayer.getPlayerState() == PlayerState.PLAYING||this.ytPlayer.getPlayerState() == PlayerState.BUFFERING);
    }

    getDuration() {
        if (this.ytPlayer && this.ytPlayer.getPlayerState) {
            return this.ytPlayer.getDuration();
        }
        return -1;
    }

    generateUniqueId() {
        return Math.random().toString(35).substr(2, 7);
    }
}
