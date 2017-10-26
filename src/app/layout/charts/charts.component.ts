import { Component, OnInit, AfterViewInit } from '@angular/core';
import { routerTransition } from '../../router.animations';
import * as d3 from 'd3';
import * as d3sc from 'd3-scale-chromatic';

@Component({
  selector: 'app-charts',
  templateUrl: './charts.component.html',
  styleUrls: ['./charts.component.scss'],
  animations: [routerTransition()]
})
export class ChartsComponent implements OnInit, AfterViewInit {
  constructor() {
  }

  ngOnInit() {
  }

  ngAfterViewInit() {
    // this.initD3Chart1();
    this.initD3Chart2();
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
      .style('fill', 'white')
      .text(function (d) { return d; });
  }  /* End initD3Chart1 */

  private initD3Chart2() {
    drawChart2();
    d3.select(window).on('resize', resizeChart2);

    function resizeChart2() {
      drawChart2();
    }

    function drawChart2() {
      // Bubble Chart reading from JSON file: https://bl.ocks.org/john-guerra/0d81ccfd24578d5d563c55e785b3b40a
      const width = document.getElementById('d3chart2_card_block').clientWidth,
        height = document.getElementById('d3chart2_card_block').clientHeight,
        diameter = Math.min(width, height);
      // console.log('drawChart2: w=' + width + ', h=' + height + ', d=' + diameter);

      // Clear out everything from the SVG element for this chart
      d3.select('#d3chart2').selectAll('*').remove();

      const format = d3.format(',d');
      const colorScheme = d3.scaleOrdinal(d3.schemeCategory20c);
      // const colorScheme = d3.scaleOrdinal()
      // .range(['#C4373C', '#BA2C48', '#9C0E2A', '#CAB42D', '#B7A13E', '#A99743', '#2B8D83', '#35978D', '#3FA197', '#49ABA1']);

      const bubble = d3.pack()
        .size([diameter * 0.9, diameter * 0.9])
        .padding(2);

      // Define div for tooltip
      const divTooltip = d3.select('body')
        .append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0);

      // Set SVG client area size and position
      const x = (width - diameter) / 2, y = (height - diameter) / 2;
      const svg = d3.select('#d3chart2')
        .attr('width', diameter)
        .attr('transform', 'translate(' + x + ',' + y + ')')
        // .attr('height', diameter)
        .attr('class', 'bubble');

      d3.json('./../../../assets/agents.xtradata.json', function (error, data) {
        if (error) { throw error; }

        const root = d3.hierarchy(classes(data))
          .sum(function (d: any) { return d.value; })
          .sort(function (a, b) { return b.value - a.value; });

        bubble(root);
        const node = svg.selectAll('.node')
          .data(root.children)
          .enter().append('g')
          .attr('class', 'node')
          .attr('transform', function (d: any) { return 'translate(' + d.x + ',' + d.y + ')'; });

        // Disabled: Standard tooltips
        // node.append('title')
        //   .html(function (d: any) {
        //     return d.data.name + ': ' + format(d.value);  // "name, size", like "Axis, 24,593"
        //   });

        node.append('circle')
          .attr('r', function (d: any) { return d.r; })
          .style('fill', function (d: any) {
            // return colorScheme(d.data.packageName);
            // console.log('packageName: ' + d.package);
            return color(d.data.rating_avg);
          })
          .on('mouseover', function (d) {
            divTooltip.style('opacity', .9);
            divTooltip.html(
              buildNodeTooltipHTML(d, true))
              .style('pointer-events', 'none')  // Else the hidden tooltip can eat mouseovers.
              .style('left', (d3.event.pageX + 12) + 'px')
              .style('top', (d3.event.pageY - 12) + 'px')
              .style('position', 'absolute')
              .style('text-align', 'center')
              .attr('width', '60px')
              .attr('height', '28px')
              .style('padding', '6px')
              .style('font', '12px sans-serif;')
              .style('background', 'lightsalmon')
              .style('border', '0px')
              .style('border-radius', '8px')
              .style('box-shadow', '5px 5px 5px rgba(0, 0, 0, 0.1');
          })
          .on('mouseout', function (d) {
            divTooltip.style('opacity', 0);
          });

        node.append('text')
          .attr('dy', '.3em')
          .style('text-anchor', 'middle')
          .style('pointer-events', 'none')
          .style('user-select', 'none')
          .text(function (d: any) {
            const name = d.data.name.substring(0, d.r / 7);
            return name.length < d.data.name.length ? name + '...' : name;
          });
      });

      d3.select(self.frameElement).style('height', diameter + 'px');

      function buildNodeTooltipHTML(d, verbose) {
        const headText = (d.data.description === '') ? d.data.name : d.data.description + '<hr>' + d.data.name;
        const currencyFormat = d3.format(',.8f');
        const wealthText = currencyFormat(d.data.wealth) + ' AGI';

        // TODO: Add Semantic UI to support table styles
        if (verbose) {
          return '<div class=\'node-detailed-tooltip\'> <table class=\'ui celled striped table\'> <thead> <tr> <th colspan=\'2\'>'
            + headText + '</th> </tr> </thead> <tbody> <tr> <td class=\'collapsing\'> <span>Wealth</span> </td> <td>'
            + wealthText + '</td> </tr> <tr> <td> <span>Rating Count</span> </td> <td>' + d.data.rating_cnt
            + '</td> </tr> <tr> <td> <span>Rating Average</span> </td> <td>' + d.data.rating_avg +
            // '</td> </tr> <tr> <td> <span>TODO</span> </td> <td>' + d.data.TODO +
            '</td> </tr> </tbody> </table> </div>';
        } else {
          return '<div class=\'node-tooltip\'> <table class=\'ui celled striped table\'> <tbody> <tr> <td nowrap>' + headText +
            '</td> </tr> </tbody> </table> </div>';
        }
      }

      function color(val) {
        // return colorScheme(val.toString());
        // return d3sc.interpolateRdYlGn(val);

        // tslint:disable:one-line
        // Low - Reds
        if (val < 0.1) { return '#C4373C'; }
        else if (val < 0.2) { return '#BA2C48'; }
        else if (val < 0.3) { return '#9C0E2A'; }
        // Mid- Yellows
        else if (val < 0.4) { return '#CAB42D'; }
        else if (val < 0.5) { return '#B7A13E'; }
        else if (val < 0.6) { return '#A99743'; }
        // High - Greens
        else if (val < 0.7) { return '#2B8D83'; }
        else if (val < 0.8) { return '#35978D'; }
        else if (val < 0.9) { return '#3FA197'; }
        else { return '#49ABA1'; }
      }

      // Returns a flattened hierarchy containing all leaf nodes under the root.
      function classes(root) {
        const classes = [];

        function recurse(name, node) {
          if (node.children) {
            node.children.forEach(function (child) { recurse(node.name, child); });
            // } else { classes.push({ packageName: name, className: node.name, value: node.size, descriptionName: node.description,
            //   wealthName: node.wealth }); }
          } else {
            classes.push({
              package: name, value: node.wealth, name: node.name, description: node.description,
              wealth: node.wealth, rating_avg: node.rating.average, rating_cnt: node.rating.count
            });
          }
        }

        recurse(null, root);
        return { children: classes };
      }
    }  /* End drawChart2() */
  }
}
