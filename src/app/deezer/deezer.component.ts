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
    position;


    constructor(public deezerMainComponent: DeezerMainService) {
    }

    ngAfterViewInit(): void {
        // noinspection JSUnusedLocalSymbols
        this.deezerMainComponent.ensureConnected((msg, socket, myDZ) => {
            console.log(msg);
            this.socket = socket;

            this.socket.on('musicPosition', (position) => {
                this.updatePosition(position);
            });
        });
    }

    private updatePosition(position) {
        this.position = position;
    }
}
