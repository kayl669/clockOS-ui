import {AfterViewInit, Component, HostListener, OnInit, ViewChild} from '@angular/core';
import {Router} from "@angular/router";
import * as io from 'socket.io-client';
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
    keyPadSocket;
    localData: any[];
    current: number;
    @ViewChild("grid1", {read: IgxGridComponent, static: false})
    public grid1: IgxGridComponent;
    private socket;

    constructor(public router: Router, private httpClient: HttpClient, private deezerMainService: DeezerMainService) {
        this.localData = [];
    }

    ngOnInit() {
        this.deezerMainService.ensureConnected((msg, socket) => {
            console.log(msg);
            this.socket = socket;
        });
    }

    ngAfterViewInit(): void {
        this.keyPadSocket = io.connect("/", {rejectUnauthorized: false});
        this.keyPadSocket
            .on('connected', (data, identification) => {
                identification('keypad');
                console.log('Connected as keypad');
            })
            .on('RIGHT', (() => {
                this.navigateRight();
            }).bind(this))
            .on('DOWN', (() => {
                this.navigateDown();
            }).bind(this))
            .on('UP', (() => {
                this.navigateUp();
            }).bind(this))
            .on('STOP', (() => {
                this.navigateStop();
            }).bind(this))
            .on('LEFT', (() => {
                this.navigateLeft();
            }).bind(this))
            .on('OK', (() => {
                this.navigateOK();
            }).bind(this));
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
        this.keyPadSocket.disconnect();
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
            this.grid1.selectRows([this.localData[this.current].stationuuid]);
        }
    }

    private navigateDown() {
        console.log('DOWN');
        if (this.localData.length > 0) {
            this.current = (this.current + 1) % this.localData.length;
            this.grid1.deselectAllRows(true);
            this.grid1.navigateTo(this.current, 0);
            this.grid1.selectRows([this.localData[this.current].stationuuid]);
        }
    }

    private navigateOK() {
        this.socket.emit('radio', {
            stationuuid: this.localData[this.current].stationuuid
        });
        this.keyPadSocket.disconnect();
        this.router.navigate(['/']);
    }

    private navigateStop() {
        this.keyPadSocket.disconnect();
        this.router.navigate(['/']);
    }

    public click($event: IGridCellEventArgs) {
        this.current = $event.cell.rowIndex;
        this.grid1.deselectAllRows(true);
        this.grid1.selectRows([this.localData[this.current].stationuuid]);
        this.navigateOK();
    }
}
