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
  constructor() {
  }

  ngOnInit() {
  }

  ngAfterViewInit() {
    this.initD3Chart1();
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

      d3.json('./../../../assets/agents.xtradata.json', function (error, data) {
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
