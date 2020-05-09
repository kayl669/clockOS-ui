import {AfterViewInit, Component, HostListener, OnInit, ViewChild} from '@angular/core';
import {DeezerMainService} from "../deezer-main.service";
import {IGridCellEventArgs, IgxGridComponent} from "igniteui-angular";
import {Router} from "@angular/router";
import {WebsocketService} from "../web-socket.service";
import DZ = DeezerSdk.DZ;

@Component({
    selector: 'app-deezer-playlist',
    templateUrl: './deezer-playlist.component.html',
    styleUrls: ['./deezer-playlist.component.scss']
})
export class DeezerPlaylistComponent implements OnInit, AfterViewInit {
    localData: any[];
    current: number;
    @ViewChild("grid1", {read: IgxGridComponent, static: false})
    public grid1: IgxGridComponent;
    private socket;

    constructor(public router: Router, private webSocket: WebsocketService, private deezerMainService: DeezerMainService) {
        this.localData = [];
    }

    ngOnInit(): void {
        this.webSocket.connect().subscribe((msg) => {
            switch (msg.data) {
                case 'LEFT':  // Left button pressed
                    this.navigateLeft();
                    break;
                case 'RIGHT':  // Right button pressed
                    this.navigateRight();
                    break;
                case 'UP':  // Up button pressed
                    this.navigateUp();
                    break;
                case 'DOWN':  // Down button pressed
                    this.navigateDown();
                    break;
                case 'OK':  // OK button pressed
                    this.navigateOK();
                    break;
                case 'SNOOZE':  // Snooze button pressed
                    console.log('SNOOZE');
                    break;
                case 'STOP':  // Stop button pressed
                    this.navigateStop();
                    break;
            }
        });
    }

    @HostListener('document:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
        switch (event.keyCode) {
            case 37:
                // Left key
                this.navigateLeft();
                break;
            case 39:
                // Right key
                this.navigateRight();
                break;
            case 38:
                // Up key
                this.navigateUp();
                break;
            case 40:
                // Down key
                this.navigateDown();
                break;
            case 35:
                // End key
                this.navigateStop();
                break;
            case 34:
                // Page down key
                this.navigateOK();
                break;
            // any other key was pressed
        }
    }

    ngAfterViewInit(): void {
        // @ts-ignore
        this.deezerMainService.ensureConnected((msg, socket) => {
            console.log(msg);
            this.socket = socket;
            DZ.api('/user/me/playlists', (response) => {
                this.localData = response.data;
                this.current = 0;
                this.grid1.selectRows([this.localData[this.current].id]);
            });
        });
    }

    private navigateLeft() {
        this.router.navigate(['/']);
    }

    private navigateRight() {
        this.navigateOK();
    }

    private navigateUp() {
        console.log('UP');
        if (this.localData.length > 0) {
            this.current = (this.localData.length + this.current - 1) % this.localData.length;
            this.grid1.deselectAllRows(true);
            this.grid1.navigateTo(this.current, 0);
            this.grid1.selectRows([this.localData[this.current].id]);
        }
    }

    private navigateDown() {
        console.log('DOWN');
        if (this.localData.length > 0) {
            this.current = (this.current + 1) % this.localData.length;
            this.grid1.deselectAllRows(true);
            this.grid1.navigateTo(this.current, 0);
            this.grid1.selectRows([this.localData[this.current].id]);
        }
    }

    private navigateOK() {
        this.socket.emit('playlist', {playlist: this.localData[this.current].id});
        this.router.navigate(['/']);
    }

    private navigateStop() {
        this.router.navigate(['/']);
    }

    public click($event: IGridCellEventArgs) {
        this.current = $event.cell.rowIndex;
        this.grid1.deselectAllRows(true);
        this.grid1.selectRows([this.localData[this.current].id]);
        this.navigateOK();
    }
}
