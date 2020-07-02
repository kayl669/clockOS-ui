import {AfterViewInit, Component} from '@angular/core';
import {DeezerMainService} from "../deezer-main.service";


@Component({
    selector: 'app-deezer',
    templateUrl: './deezer.component.html',
    styleUrls: ['./deezer.component.scss']
})
export class DeezerComponent implements AfterViewInit {
    socket;
    position;


    constructor(public deezerMainComponent: DeezerMainService) {
    }

    ngAfterViewInit(): void {
        this.deezerMainComponent.ensureConnected((msg, socket) => {
            console.log(msg);
            this.socket = socket;
            this.deezerMainComponent.ensureDeezerConnected((msg, socket) => {
                console.log(msg);
                this.socket = socket;

                this.socket.on('musicPosition', (position) => {
                    this.updatePosition(position);
                });
            });
        });
    }

    private updatePosition(position) {
        this.position = position;
    }
}
