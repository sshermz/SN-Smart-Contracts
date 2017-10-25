import { Component, OnInit } from '@angular/core';
import { routerTransition } from '../../router.animations';
import { NgbCarouselConfig } from '@ng-bootstrap/ng-bootstrap';

/* TODO:
@Component({
  selector: 'app-ngbd-carousel-config',
  templateUrl: './dashboard.component.html',
  providers: [NgbCarouselConfig] // add NgbCarouselConfig to the component providers
})
export class NgbdCarouselConfigComponent {
  constructor(config: NgbCarouselConfig) {
    // customize default values of carousels used by this component tree
    config.interval = 10000;
    // config.wrap = false;
    // config.keyboard = false;
  }
}
*/

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],
    animations: [routerTransition()]
})
export class DashboardComponent implements OnInit {
    public alerts: Array<any> = [];
    public sliders: Array<any> = [];

    constructor() {
        this.sliders.push({
            imagePath: 'assets/images/slider1.jpg',
            label: '',
            text: ''
        }, {
            imagePath: 'assets/images/slider2.jpg',
            label: '',
            text: ''
        }, {
            imagePath: 'assets/images/slider3.jpg',
            label: '',
            text: ''
        }, {
            imagePath: 'assets/images/slider4.jpg',
            label: '',
            text: ''
        }, {
            imagePath: 'assets/images/slider5.jpg',
            label: '',
            text: ''
        // }, {
        //     imagePath: 'assets/images/slider6.jpg',
        //     label: '',
        //     text: ''
        });

        // this.alerts.push({
        //     id: 1,
        //     type: 'success',
        //     message: `Lorem ipsum dolor sit amet, consectetur adipisicing elit.
        //         Voluptates est animi quibusdam praesentium quam, et perspiciatis,
        //         consectetur velit culpa molestias dignissimos
        //         voluptatum veritatis quod aliquam! Rerum placeat necessitatibus, vitae dolorum`
        // }, {
        //     id: 2,
        //     type: 'warning',
        //     message: `Lorem ipsum dolor sit amet, consectetur adipisicing elit.
        //         Voluptates est animi quibusdam praesentium quam, et perspiciatis,
        //         consectetur velit culpa molestias dignissimos
        //         voluptatum veritatis quod aliquam! Rerum placeat necessitatibus, vitae dolorum`
        // });
    }

    ngOnInit() {
    }

    public closeAlert(alert: any) {
        const index: number = this.alerts.indexOf(alert);
        this.alerts.splice(index, 1);
    }
}
