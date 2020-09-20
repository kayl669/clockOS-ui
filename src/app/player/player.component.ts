import {AfterViewInit, Component} from '@angular/core';
import {PlayerMainService} from "../player-main.service";
import {YoutubePlayerService} from "../youtube-player.service";


@Component({
    selector: 'app-player',
    templateUrl: './player.component.html',
    styleUrls: ['./player.component.scss']
})
export class PlayerComponent implements AfterViewInit {
    socket;
    position;
    public fullscreenActive = false;
    public shouldHideControl = false;
    timeout;

    constructor(public playerMainService: PlayerMainService, private youtubePlayerService: YoutubePlayerService) {
    }

    ngAfterViewInit(): void {
        let doc = window.document;
        let playerApi = doc.createElement('script');
        playerApi.type = 'text/javascript';
        playerApi.src = 'https://www.youtube.com/iframe_api';
        doc.body.appendChild(playerApi);
        this.youtubePlayerService.createPlayer();
        this.playerMainService.ensureConnected((msg, socket) => {
            console.log(msg);
            this.socket = socket;
            this.playerMainService.ensurePlayerConnected((msg, socket) => {
                console.log(msg);
                this.socket = socket;

                this.socket.on('musicPosition', (position) => {
                    this.updatePosition(position);
                });
            });
        });
    }

    toggleFullscreen(): void {
        this.fullscreenActive = !this.fullscreenActive;
        if (this.fullscreenActive) {
            this.timeout = setTimeout(() => this.shouldHideControl = true, 5000);
        } else {
            clearTimeout(this.timeout);
            this.shouldHideControl = false;
        }

        let width = this.fullscreenActive ? 720 : 160;
        let height = this.fullscreenActive ? 480 : 160;
        this.youtubePlayerService.resizePlayer(width, height);
    }

    private updatePosition(position) {
        this.position = position;
    }

    public seekTo(event) {
        let position = event.value * this.youtubePlayerService.getDuration() / 100;
        console.log(position, this.youtubePlayerService.getDuration());
        this.youtubePlayerService.seekTo(position);
    }
}
