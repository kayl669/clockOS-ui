import {AfterViewInit, Component, HostListener, OnInit, ViewChild} from '@angular/core';
import {PlayerMainService} from "../player-main.service";
import {IGridCellEventArgs, IgxGridComponent} from "igniteui-angular";
import {Router} from "@angular/router";
import {KeypadService} from "../keypad.service";


@Component({
    selector: 'app-playlist',
    templateUrl: './playlist.component.html',
    styleUrls: ['./playlist.component.scss']
})
export class PlaylistComponent implements OnInit, AfterViewInit {
    muted: boolean = true;
    localData: any[];
    current: number;
    @ViewChild("grid1", {read: IgxGridComponent, static: false})
    public grid1: IgxGridComponent;

    constructor(public router: Router, private playerMainService: PlayerMainService, private keypadService: KeypadService) {
        this.localData = [];
    }

    ngOnInit(): void {
        this.keypadService.rightEvent.subscribe((() => {
            if (!this.muted) this.navigateRight();
        }).bind(this));
        this.keypadService.downEvent.subscribe((() => {
            if (!this.muted) this.navigateDown();
        }).bind(this));
        this.keypadService.upEvent.subscribe((() => {
            if (!this.muted) this.navigateUp();
        }).bind(this));
        this.keypadService.stopEvent.subscribe((() => {
            if (!this.muted) this.navigateStop();
        }).bind(this));
        this.keypadService.leftEvent.subscribe((() => {
            if (!this.muted) this.navigateLeft();
        }).bind(this));
        this.keypadService.oKEvent.subscribe((() => {
            if (!this.muted) this.navigateOK();
        }).bind(this));
    }

    @HostListener('document:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
        this.keypadService.handleKeyboardEvent(event);
    }

    ngAfterViewInit(): void {
        this.muted = false;
        this.playerMainService.searchPlayLists().then((response) => {
            this.localData = response;
            this.current = 0;
            this.grid1.selectRows([this.localData[this.current].id]);
        });
    }

    private navigateLeft() {
        this.muted = true;
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
        this.playerMainService.playList(this.localData[this.current].id);
        this.muted = true;
        this.router.navigate(['/']);
    }

    private navigateStop() {
        this.muted = true;
        this.router.navigate(['/']);
    }

    public click($event: IGridCellEventArgs) {
        this.current = $event.cell.rowIndex;
        this.grid1.deselectAllRows(true);
        this.grid1.selectRows([this.localData[this.current].id]);
        this.navigateOK();
    }
}
