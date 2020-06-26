import {Component, HostListener, OnInit, ViewEncapsulation} from '@angular/core';
import keyNavigation from 'simple-keyboard-key-navigation';
import Keyboard from 'simple-keyboard';
import {Router} from '@angular/router';
import {WebsocketService} from '../web-socket.service';
import {WeatherService} from '../weather.service';

@Component({
    selector: 'app-weather',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './weather.component.html',
    styleUrls: ['../../../node_modules/simple-keyboard/build/css/index.css',
        './weather.component.scss']
})
export class WeatherComponent implements OnInit {
    constructor(public router: Router, private webSocket: WebsocketService, private weatherService: WeatherService) {
    }

    keyboard: Keyboard;

    ngOnInit(): void {
        this.weatherService.getCity().subscribe(data => {
            this.keyboard.setInput(data.city);
        });
        this.keyboard = new Keyboard({
            onChange: input => this.onChange(input),
            onKeyPress: button => this.onKeyPress(button),
            debug: true,
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
                    'a z e r t y u i o p',
                    'q s d f g h j k l',
                    '{shift} w x c v b n m {backspace}',
                    '{escape} {numbers} {space} {ent}'
                ],
                shift: [
                    'A Z E R T Y U I O P',
                    'Q S D F G H J K L',
                    '{shift} W X C V B N M {backspace}',
                    '{escape} {numbers} {space} {ent}'
                ],
                numbers: ['1 2 3', '4 5 6', '7 8 9', '{escape} {abc} 0 {backspace}']
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
            this.router.navigate(['/']);
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
        // @ts-ignore
        this.keyboard.modules.keyNavigation.left();
    }

    private navigateRight() {
        // @ts-ignore
        this.keyboard.modules.keyNavigation.right();
    }

    private navigateUp() {
        // @ts-ignore
        this.keyboard.modules.keyNavigation.up();
    }

    private navigateDown() {
        // @ts-ignore
        this.keyboard.modules.keyNavigation.down();
    }

    private navigateOK() {
        // @ts-ignore
        this.keyboard.modules.keyNavigation.press();
    }

    private navigateStop() {
        this.router.navigate(['/']);
    }

    private navigateEnter() {
        this.weatherService.setCity(this.keyboard.getInput());
        this.router.navigate(['/']);
    }
}
