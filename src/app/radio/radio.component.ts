import {AfterViewInit, Component, HostListener, OnInit, ViewChild} from '@angular/core';
import {Router} from "@angular/router";
import {WebsocketService} from "../web-socket.service";
import {HttpClient} from "@angular/common/http";
import {IRadio} from "../interfaces";
import {IGridCellEventArgs, IgxGridComponent} from "igniteui-angular";
import {DeezerMainService} from "../deezer-main.service";

@Component({
    selector: 'app-radio',
    templateUrl: './radio.component.html',
    styleUrls: ['./radio.component.scss']
})
export class RadioComponent implements OnInit, AfterViewInit {
    localData: any[];
    current: number;
    @ViewChild("grid1", {read: IgxGridComponent, static: false})
    public grid1: IgxGridComponent;
    private socket;

    constructor(public router: Router, private webSocket: WebsocketService, private httpClient: HttpClient, private deezerMainService: DeezerMainService) {
        this.localData = [];
    }

    ngOnInit() {
        this.deezerMainService.ensureConnected((msg, socket) => {
            console.log(msg);
            this.socket = socket;
        });
    }

    ngAfterViewInit(): void {
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
        this.httpClient.get<IRadio[]>("https://de1.api.radio-browser.info/json/stations/search?countrycode=FR&language=fr&limit=30&order=clickcount&reverse=true").subscribe(data => {
            console.log(data);
            this.localData = data;
            this.current = 0;
            this.grid1.selectRows([this.localData[this.current].url]);
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
            default:
            // any other key was pressed
        }
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
            this.grid1.selectRows([this.localData[this.current].url]);
        }
    }

    private navigateDown() {
        console.log('DOWN');
        if (this.localData.length > 0) {
            this.current = (this.current + 1) % this.localData.length;
            this.grid1.deselectAllRows(true);
            this.grid1.navigateTo(this.current, 0);
            this.grid1.selectRows([this.localData[this.current].url]);
        }
    }

    private navigateOK() {
        this.socket.emit('radio', {
            name: this.localData[this.current].name,
            url: this.localData[this.current].url,
            favicon: this.localData[this.current].favicon
        });
        this.router.navigate(['/']);
    }

    private navigateStop() {
        this.router.navigate(['/']);
    }

    public click($event: IGridCellEventArgs) {
        this.current = $event.cell.rowIndex;
        this.grid1.deselectAllRows(true);
        this.grid1.selectRows([this.localData[this.current].url]);
        this.navigateOK();
    }
}
