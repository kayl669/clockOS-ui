import {AfterViewInit, Component, HostListener, OnInit, ViewChild} from '@angular/core';
import {DeezerMainService} from "../deezer-main.service";
import {IgxGridComponent} from "igniteui-angular";
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
    @ViewChild("grid1", {read: IgxGridComponent, static: true})
    public grid1: IgxGridComponent;
    private socket;

    constructor(public router: Router, private webSocket: WebsocketService, private deezerMainService: DeezerMainService) {
    }

    ngOnInit(): void {
        this.webSocket.connect().subscribe((msg) => {
            console.log('Response from websocket: ' + msg.data);
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
            case 17:
                // Right ctrl key
                this.navigateStop();
                break;
            case 13:
                // Return key
                this.navigateOK();
                break;
            // any other key was pressed
        }
    }

    ngAfterViewInit(): void {
        // @ts-ignore
        this.deezerMainService.ensureConnected((msg, socket, token) => {
            console.log(msg);
            console.log(token);
            this.socket = socket;
            DZ.api('/user/me/playlists', (response) => {
                this.localData = response.data;
                this.current = 0;
                console.log(response.data);
            });
        });
    }

    private navigateLeft() {
    }

    private navigateRight() {
    }

    private navigateUp() {
        if (this.localData.length > 0) {
            this.grid1.getRowByIndex(this.current).selected = false;
            this.current = (this.localData.length + this.current - 1) % this.localData.length;
            this.grid1.getRowByIndex(this.current).selected = true;
        }
    }

    private navigateDown() {
        if (this.localData.length > 0) {
            this.grid1.getRowByIndex(this.current).selected = false;
            this.current = (this.current + 1) % this.localData.length;
            this.grid1.getRowByIndex(this.current).selected = true;
        }
    }

    private navigateOK() {
        var tracks = [];
        DZ.api('/playlist/' + this.localData[this.current].id + '/tracks', ((response) => {
            console.log(response);
            for (let i = 0; i < response.data.length; i++) {
                tracks.push(response.data[i].id);
            }
            this.socket.emit('tracks', tracks);
        }).bind(this));
        this.router.navigate(['/']);
    }

    private navigateStop() {
        this.router.navigate(['/']);
    }
}
