import { Component, OnInit, AfterViewInit } from '@angular/core';
import { routerTransition } from '../../router.animations';
import * as d3 from 'd3';

@Component({
  selector: 'app-charts',
  templateUrl: './charts.component.html',
  styleUrls: ['./charts.component.scss'],
  animations: [routerTransition()]
})
export class ChartsComponent implements OnInit, AfterViewInit {
  // bar chart
  public barChartOptions: any = {
    scaleShowVerticalLines: false,
    responsive: true
  };
  public barChartLabels: string[] = ['2006', '2007', '2008', '2009', '2010', '2011', '2012'];
  public barChartType = 'bar';
  public barChartLegend = true;

  public barChartData: any[] = [
    { data: [65, 59, 80, 81, 56, 55, 40], label: 'Series A' },
    { data: [28, 48, 40, 19, 86, 27, 90], label: 'Series B' }
  ];
  // Doughnut
  public doughnutChartLabels: string[] = ['Download Sales', 'In-Store Sales', 'Mail-Order Sales'];
  public doughnutChartData: number[] = [350, 450, 100];
  public doughnutChartType = 'doughnut';
  // Radar
  public radarChartLabels: string[] = ['Eating', 'Drinking', 'Sleeping', 'Designing', 'Coding', 'Cycling', 'Running'];
  public radarChartData: any = [
    { data: [65, 59, 90, 81, 56, 55, 40], label: 'Series A' },
    { data: [28, 48, 40, 19, 96, 27, 100], label: 'Series B' }
  ];
  public radarChartType = 'radar';
  // Pie
  public pieChartLabels: string[] = ['Download Sales', 'In-Store Sales', 'Mail Sales'];
  public pieChartData: number[] = [300, 500, 100];
  public pieChartType = 'pie';
  // PolarArea
  public polarAreaChartLabels: string[] = ['Download Sales', 'In-Store Sales', 'Mail Sales', 'Telesales', 'Corporate Sales'];
  public polarAreaChartData: number[] = [300, 500, 100, 40, 120];
  public polarAreaLegend = true;

  public polarAreaChartType = 'polarArea';
  // lineChart
  public lineChartData: Array<any> = [
    { data: [65, 59, 80, 81, 56, 55, 40], label: 'Series A' },
    { data: [28, 48, 40, 19, 86, 27, 90], label: 'Series B' },
    { data: [18, 48, 77, 9, 100, 27, 40], label: 'Series C' }
  ];
  public lineChartLabels: Array<any> = ['January', 'February', 'March', 'April', 'May', 'June', 'July'];
  public lineChartOptions: any = {
    responsive: true
  };
  public lineChartColors: Array<any> = [
    { // grey
      backgroundColor: 'rgba(148,159,177,0.2)',
      borderColor: 'rgba(148,159,177,1)',
      pointBackgroundColor: 'rgba(148,159,177,1)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(148,159,177,0.8)'
    },
    { // dark grey
      backgroundColor: 'rgba(77,83,96,0.2)',
      borderColor: 'rgba(77,83,96,1)',
      pointBackgroundColor: 'rgba(77,83,96,1)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(77,83,96,1)'
    },
    { // grey
      backgroundColor: 'rgba(148,159,177,0.2)',
      borderColor: 'rgba(148,159,177,1)',
      pointBackgroundColor: 'rgba(148,159,177,1)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(148,159,177,0.8)'
    }
  ];
  public lineChartLegend = true;
  public lineChartType = 'line';

  // events
  public chartClicked(e: any): void {
    // console.log(e);
  }

  public chartHovered(e: any): void {
    // console.log(e);
  }

  public randomize(): void {
    // Only Change 3 values
    const data = [
      Math.round(Math.random() * 100),
      59,
      80,
      (Math.random() * 100),
      56,
      (Math.random() * 100),
      40
    ];
    const clone = JSON.parse(JSON.stringify(this.barChartData));
    clone[0].data = data;
    this.barChartData = clone;
    /**
     * (My guess), for Angular to recognize the change in the dataset
     * it has to change the dataset variable directly,
     * so one way around it, is to clone the data, change it and then
     * assign it;
     */
  }

  constructor() {
  }

  ngOnInit() {
  }

  ngAfterViewInit() {
    this.initD3Chart1();
//    this.initD3Chart2();
    this.initD3Chart2a();
  }

  private initD3Chart1() {
    // this.parsedJson = this.networkService.getParsedJson(this.atoms.result.atoms);
    // this.draw_graph();
    // isSimulationRunning = true;
    // this.isInitialLoad = false;
    const data = [4, 8, 15, 16, 23, 42];
    const width = 420, barHeight = 20;
    const x = d3.scaleLinear()
      .domain([0, d3.max(data)])
      .range([0, width]);
    const chart = d3.select('#d3chart1')
      .attr('width', width);
      // .attr('height', barHeight * data.length);
      // .attr('height', 300);
    const bar = chart.selectAll('g')
      .data(data)
      .enter().append('g')
      .attr('transform', function (d, i) { return 'translate(0,' + i * barHeight + ')'; });
    bar.append('rect')
      .attr('width', x)
      .attr('height', barHeight - 1);
    bar.append('text')
      .attr('x', function (d) { return x(d) - 3; })
      .attr('y', barHeight / 2)
      .attr('dy', '.35em')
      .text(function (d) { return d; });
  }  /* End initD3Chart1 */

  private initD3Chart2() {
    // const width = 420, height = 420;
    // const width = document.getElementById('d3chart2').clientWidth;
    // const height = document.getElementById('d3chart2').clientHeight;
    const width = document.getElementById('d3chart2_card_block').clientWidth;
    const height = 420; // document.getElementById('d3chart2_card_block').clientHeight;
    const svg = d3.select('#d3chart2')
      .attr('width', width)
      .attr('height', height);
    //    width = +svg.attr('width'),
    //    height = +svg.attr('height');
    const format = d3.format(',d');
    const color = d3.scaleOrdinal(d3.schemeCategory20c);
    const pack = d3.pack()
      .size([width, height])
      .padding(1.5);

    d3.csv('./../../../assets/flare.csv', function (d: any) {
      d.value = +d.value;
      if (d.value) { return d; }
    }, function (error, classes) {
      if (error) { throw error; }

      const root = d3.hierarchy({ children: classes })
        .sum(function (d: any) { return d.value; })
        .each(function (d: any) {
          let id: any;
          if (id = d.data.id) {
            // let id, i = id.lastIndexOf('.');
            const i: any = id.lastIndexOf('.');
            d.id = id;
            d.package = id.slice(0, i);
            d.class = id.slice(i + 1);
          }
        });

      const node = svg.selectAll('.node')
        .data(pack(root).leaves())
        .enter().append('g')
        .attr('class', 'node')
        .attr('transform', function (d) { return 'translate(' + d.x + ',' + d.y + ')'; });

      node.append('circle')
        .attr('id', function (d) { return d.id; })
        .attr('r', function (d) { return d.r; })
        .style('fill', function (d: any) { return color(d.package); });

      node.append('clipPath')
        .attr('id', function (d) { return 'clip-' + d.id; })
        .append('use')
        .attr('xlink:href', function (d) { return '#' + d.id; });

      node.append('text')
        .attr('clip-path', function (d) { return 'url(#clip-' + d.id + ')'; })
        .selectAll('tspan')
        .data(function (d: any) { return d.class.split(/(?=[A-Z][^A-Z])/g); })
        .enter().append('tspan')
        .attr('x', 0)
        .attr('y', function (d, i, nodes) { return 13 + (i - nodes.length / 2 - 0.5) * 10; })
        .text(function (d: any) { return d; });

      node.append('title')
        .text(function (d) { return d.id + '\n' + format(d.value); });
    });
  }  /* End initD3Chart2 */

  private initD3Chart2a() {
    // Bubble Chart reading from JSON file: https://bl.ocks.org/john-guerra/0d81ccfd24578d5d563c55e785b3b40a
//    const diameter = 960,
//    const diameter = 300,
    const diameter = document.getElementById('d3chart2_card_block').clientWidth * 0.80,
      format = d3.format(',d'),  // Format number w/thousands separator (https://github.com/d3/d3-format)
      colorScheme = d3.scaleOrdinal(d3.schemeCategory20c);

    const bubble = d3.pack()
      .size([diameter, diameter])
      .padding(1.5);

    const svg = d3.select('#d3chart2')
      .attr('width', diameter)
      // .attr('height', diameter)
      .attr('class', 'bubble');

//      d3.json('./../../../assets/agents.mockup2.json', function (error, data) {  // flare.json: Ex: {"name": "Axes", "size": 1302}
      d3.json('./../../../assets/agents.json', function (error, data) {  // flare.json: Ex: {"name": "Axes", "size": 1302}
      if (error) { throw error; }

      const root = d3.hierarchy(classes(data))
        .sum(function (d: any) { return d.nodeValue; })
        .sort(function (a, b) { return b.value - a.value; });

      bubble(root);
      const node = svg.selectAll('.node')
        .data(root.children)
        .enter().append('g')
        .attr('class', 'node')
        .attr('transform', function (d: any) { return 'translate(' + d.x + ',' + d.y + ')'; });

      node.append('title')
        .text(function (d: any) {
          return d.data.nodeName + ': ' + format(d.nodeValue);
        });  // "name, size", like "Axis, 24,593"

      node.append('circle')
        .attr('r', function (d: any) { return d.r; })
        .style('fill', function (d: any) {
          // return colorScheme(d.data.packageName);
          // console.log('packageName: ' + d.nodePackage);
          return color(d.data.nodeRating);
        });

      node.append('text')
        .attr('dy', '.3em')
        .style('text-anchor', 'middle')
        .text(function (d: any) {
          // const name = d.data.className.substring(0, d.r / 3);
          const name = d.data.nodeName.substring(0, 10) + '...';
          return name;
        });
    });

    function color(val) {
      return colorScheme(val.toString());
    }

    // Returns a flattened hierarchy containing all leaf nodes under the root.
    function classes(root) {
      const classes = [];

      function recurse(name, node) {
        if (node.children) {
          node.children.forEach(function (child) { recurse(node.name, child); });
        // } else { classes.push({ packageName: name, className: node.name, value: node.size, descriptionName: node.description,
        //   wealthName: node.wealth }); }
        } else { classes.push({ nodePackage: name, nodeValue: node.wealth, nodeName: node.name, nodeDescription: node.description,
          nodeWealth: node.wealth, nodeRating: node.rating.average }); }
      }

      recurse(null, root);
      return { children: classes };
    }

    d3.select(self.frameElement).style('height', diameter + 'px');
  }  /* End initD3Chart2a */
}
