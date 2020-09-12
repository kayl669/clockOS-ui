import {AfterViewInit, Component} from '@angular/core';
import {PlayerMainService} from "../player-main.service";


@Component({
    selector: 'app-player',
    templateUrl: './player.component.html',
    styleUrls: ['./player.component.scss']
})
export class PlayerComponent implements AfterViewInit {
    socket;
    position;


    constructor(public playerMainService: PlayerMainService) {
    }

    ngAfterViewInit(): void {
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

    private updatePosition(position) {
        this.position = position;
    }
}
