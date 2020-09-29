import {AfterViewInit, Component, Renderer2} from '@angular/core';
import {PlayerMainService} from "../player-main.service";
import {YoutubePlayerService} from "../youtube-player.service";
import {ScriptService} from "ngx-script-loader";


@Component({
    selector: 'app-player',
    templateUrl: './player.component.html',
    styleUrls: ['./player.component.scss']
})
export class PlayerComponent implements AfterViewInit {
    position;
    public fullscreenActive = false;
    public shouldHideControl = false;
    timeout;

    constructor(private scriptService: ScriptService, public playerMainService: PlayerMainService, private youtubePlayerService: YoutubePlayerService, private renderer: Renderer2) {
        this.playerMainService.positionChangedEvent.subscribe(((position) => {
            this.updatePosition(position);
        }).bind(this));
    }

    ngAfterViewInit() {
        const htmlId = this.youtubePlayerService.generateUniqueId();
        const container = this.renderer.selectRootElement('#yt-player');
        this.renderer.setAttribute(container, 'id', htmlId);

        this.youtubePlayerService.loadPlayerApi(htmlId);
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
        this.playerMainService.seek(position);
    }
}
