import {AfterViewInit, Component, HostListener, OnInit, ViewEncapsulation} from '@angular/core';
import {Router} from '@angular/router';
import {WebsocketService} from '../web-socket.service';
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {IWifiConnect, IWifiScan} from "../interfaces";
import keyNavigation from 'simple-keyboard-key-navigation';
import Keyboard from 'simple-keyboard';

@Component({
    selector: 'app-settings',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './settings.component.html',
    styleUrls: ['../../../node_modules/simple-keyboard/build/css/index.css',
        './settings.component.scss']
})
export class SettingsComponent implements OnInit, AfterViewInit {
    constructor(public router: Router, private webSocket: WebsocketService, private httpClient: HttpClient) {
    }

    keyboard: Keyboard;
    displayKeyboard: boolean;
    displayStatus: boolean;
    networks: IWifiScan[] = [];
    status: string;
    current: number;

    ngOnInit(): void {
        this.keyboard = new Keyboard({
            onChange: input => this.onChange(input),
            onKeyPress: button => this.onKeyPress(button),
            physicalKeyboardHighlight: true,
            syncInstanceInputs: true,
            mergeDisplay: true,
            useMouseEvents: true,
            // Add
            //    enableKeyNavigation?:boolean;
            // to index.d.ts to make it work.
            // enableKeyNavigation: true,
            theme: 'hg-theme-default myTheme1',
            layoutName: 'default',
            layout: {
                default: [
                    "{escape} \u00B2 & \u00E9 \" ' ( - \u00E8 _ \u00E7 \u00E0 ) = {bksp}",
                    "a z e r t y u i o p",
                    "q s d f g h j k l",
                    "{shift} w x c v b n m {backspace}",
                    "{numbers} {space} {ent}"
                ],
                shift: [
                    "{escape} {//} 1 2 3 4 5 6 7 8 9 0 \u00B0 + {bksp}",
                    "A Z E R T Y U I O P",
                    "Q S D F G H J K L",
                    "{shift} W X C V B N M {backspace}",
                    "{numbers} {space} {ent}"
                ],
                numbers: ['1 2 3', '4 5 6', '7 8 9', '{abc} 0 {backspace}']
            },
            display: {
                '{numbers}': '123',
                '{ent}': 'Entrée',
                '{escape}': 'Echap',
                '{tab}': 'tab ⇥',
                '{backspace}': '⌫',
                '{capslock}': 'Maj ⇪',
                '{shift}': '⇧',
            },
            // @ts-ignore
            modules: [
                keyNavigation
            ],
        });
        this.keyboard.options.enableKeyNavigation = true;
    }


    ngAfterViewInit() {
        this.httpClient.get<IWifiScan[]>("/wifiScan").subscribe(data => {
            this.keyboard.setInput('');
            this.networks = data;
            this.current = 0;
        });
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
            default:
                if (event.keyCode === 8 || event.keyCode === 46) {
                    this.keyboard.setInput(this.keyboard.getInput().substr(0, this.keyboard.getInput().length - 1));
                } else if (event.keyCode >= 32 && event.keyCode <= 126) {
                    this.keyboard.setInput(this.keyboard.getInput() + event.key);
                }
            // any other key was pressed
        }
    }

    onChange(input: string) {
        console.log('Input changed', input);
    }

    onKeyPress(button: string) {
        console.log('Button pressed', button);

        /**
         * If you want to handle the shift and caps lock buttons
         */
        if (button === '{shift}' || button === '{lock}') {
            this.handleShift();
        }
        if (button === '{numbers}' || button === '{abc}') {
            this.handleNumbers();
        }
        if (button === '{escape}') {
            this.displayKeyboard = false;
        }
        if (button === '{ent}') {
            this.navigateEnter();
        }
    }


    handleNumbers() {
        const currentLayout = this.keyboard.options.layoutName;
        const numbersToggle = currentLayout !== 'numbers' ? 'numbers' : 'default';

        this.keyboard.setOptions({
            layoutName: numbersToggle
        });
    }

    handleShift() {
        const currentLayout = this.keyboard.options.layoutName;
        const shiftToggle = currentLayout === 'default' ? 'shift' : 'default';

        this.keyboard.setOptions({
            layoutName: shiftToggle
        });
    }

    private navigateLeft() {
        if (this.displayKeyboard) {
            // @ts-ignore
            this.keyboard.modules.keyNavigation.left();
        } else {
            this.router.navigate(['/']);
        }
    }

    public navigateRight() {
        if (!this.displayKeyboard && this.networks.length > 0) {
            this.displayKeyboard = true;
        } else if (this.displayKeyboard) {
            // @ts-ignore
            this.keyboard.modules.keyNavigation.right();
        }
    }

    private navigateUp() {
        if (this.displayKeyboard) {
            // @ts-ignore
            this.keyboard.modules.keyNavigation.up();
        } else {
            this.current = (this.networks.length + this.current - 1) % this.networks.length;
        }
    }

    private navigateDown() {
        if (this.displayKeyboard) {
            // @ts-ignore
            this.keyboard.modules.keyNavigation.down();
        } else {
            this.current = (this.current + 1) % this.networks.length;
        }

    }

    private navigateOK() {
        if (this.displayKeyboard) {
            // @ts-ignore
            this.keyboard.modules.keyNavigation.press();
        }
    }

    private navigateStop() {
        this.router.navigate(['/']);
    }


    private navigateEnter() {
        if (!this.status) {
            const headers = new HttpHeaders()
                .set('Content-Type', 'application/json');
            this.displayKeyboard = false;
            this.displayStatus = true;

            this.httpClient.post<IWifiConnect>('/wifiConnect', {
                ssid: this.networks[this.current].ssid,
                psk: this.keyboard.getInput()
            }, {headers}).subscribe(res => {
                this.httpClient.get('/wifiState').subscribe(data => {
                    if (data) {
                        this.status = "Connecté";
                    }
                });
            });
        } else {
            this.router.navigate(['/']);
        }
    }
}
