import {EventEmitter, Injectable, Output} from '@angular/core';

let _window: any = window;

@Injectable()
export class YoutubePlayerService {
    public yt_player = null;
    private currentVideoId: string;
    private currentPlaylistId: string;
    private currentVideoText: string;
    private playerReady: boolean = false;

    @Output() videoChangeEvent: EventEmitter<any> = new EventEmitter(true);
    @Output() playPauseEvent: EventEmitter<any> = new EventEmitter(true);
    @Output() currentPosition: EventEmitter<any> = new EventEmitter(true);
    @Output() currentTrack: EventEmitter<any> = new EventEmitter(true);

    createPlayer(): void {
        this.playerReady = false;
        this.yt_player = null;
        let interval = setInterval((() => {
            if ((typeof _window.YT !== 'undefined') && _window.YT && _window.YT.Player) {
                this.yt_player = new _window.YT.Player('yt-player', {
                    width: '160',
                    height: '160',
                    playerVars: {
                        iv_load_policy: '3',
                        rel: '0',
                        controls: '0',
                        disablekb: '1',
                        showinfo: '0',
                        fs: '0',
                        modestbranding: '1'

                    },
                    events: {
                        onReady: (() => {
                            console.log("Ready to rock", this.currentVideoId, this.currentPlaylistId, this.currentVideoText);
                            this.playerReady = true;
                            if (this.currentVideoId != null)
                                this.playVideo(this.currentVideoId, this.currentPlaylistId, this.currentVideoText);
                        }).bind(this),
                        onStateChange: (ev) => {
                            this.onPlayerStateChange(ev);
                        }
                    }
                });
                clearInterval(interval);
            }
        }).bind(this), 100);
    }

    onPlayerStateChange(event: any) {
        const state = event.data;
        console.log('onPlayerStateChange', event);
        switch (state) {
            case 0:
                this.videoChangeEvent.emit(true);
                this.playPauseEvent.emit('stop');
                break;
            case 1:
                this.updateBar();
                this.playPauseEvent.emit('play');
                break;
            case 2:
                this.playPauseEvent.emit('pause');
                break;
        }
    }

    updateBar() {
        if (this.yt_player != null && this.yt_player.getPlayerState() == 1) {
            this.currentPosition.emit({position: this.yt_player.getCurrentTime(), total: this.yt_player.getDuration()});
            setTimeout((this.updateBar).bind(this), 1000);
        }
    }

    playVideo(videoId: string, playlistId: string, videoText: string): void {
        this.currentVideoId = videoId;
        this.currentPlaylistId = playlistId;
        this.currentVideoText = videoText;
        if (!this.currentVideoId || this.yt_player == null || !this.playerReady) {
            return;
        }
        console.log("Reading ", this.currentVideoId, ' playlistId ', this.currentPlaylistId, this.currentVideoText);
        this.yt_player.loadVideoById({'videoId': videoId, 'list': playlistId, 'suggestedQuality': 'medium'});
        this.currentTrack.emit({
            videoId: this.currentVideoId,
            playlistId: this.currentPlaylistId,
            title: this.currentVideoText
        });
    }

    pausePlayingVideo(): void {
        if (this.yt_player != null)
            this.yt_player.pauseVideo();
    }

    stopPlayingVideo(): void {
        this.currentVideoId = '';
        this.currentPlaylistId = '';
        this.currentVideoText = '';
        if (this.yt_player != null) {
            this.yt_player.stopVideo();
        }
    }

    playPausedVideo(): void {
        if (this.yt_player != null)
            this.yt_player.playVideo();
    }

    resizePlayer(width: number, height: number) {
        if (this.yt_player != null)
            this.yt_player.setSize(width, height);
    }

    setVolume(volume: number) {
        if (this.yt_player != null)
            this.yt_player.setVolume(volume);
    }

    getVolume(): number {
        if (this.yt_player != null)
            return this.yt_player.getVolume();
        return -1;
    }

    seekTo(position: number) {
        if (this.yt_player != null)
            this.yt_player.seekTo(position, true);
    }

    isPlaying() {
        if (this.yt_player == null)
            return false;
        let playerState = this.yt_player.getPlayerState();
        return playerState == 1 || playerState == 3 || playerState == 5;
    }

    getDuration() {
        if (this.yt_player == null)
            return -1;
        return this.yt_player.getDuration();
    }
}
