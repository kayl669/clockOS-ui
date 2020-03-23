import {AfterViewInit, Component} from '@angular/core';
import {DeezerMainService} from "../deezer-main.service";
import DZ = DeezerSdk.DZ;


@Component({
    selector: 'app-deezer',
    templateUrl: './deezer.component.html',
    styleUrls: ['./deezer.component.scss']
})
export class DeezerComponent implements AfterViewInit {
    socket;
    queue = [];
    visibleInfo = false;
    title = '';
    artist = '';
    album = '';
    cover = '';
    track;
    position;


    constructor(private deezerMainComponent: DeezerMainService) {
    }

    ngAfterViewInit(): void {
        this.deezerMainComponent.ensureConnected((msg, socket, token) => {
            console.log(msg);
            console.log(token);
            this.socket = socket;
            this.deezerMainComponent.socket.on('infos', (data) => {
                this.updateInfos(data);
            });

            this.deezerMainComponent.socket.on('musicPosition', (position) => {
                this.updatePosition(position);
            });
        });
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
}
