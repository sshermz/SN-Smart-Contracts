import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { routerTransition } from '../../router.animations';
import * as d3 from 'd3';
import * as d3sc from 'd3-scale-chromatic';
import * as d3cb from 'd3-colorbar';
// interface Document {  documentMode?: any; }

/*
 * ## Class ChartsComponent ##
 */
@Component({
  selector: 'app-charts',
  templateUrl: './charts.component.html',
  styleUrls: ['./charts.component.scss'],
  animations: [routerTransition()]
})
export class ChartsComponent implements OnInit, OnDestroy, AfterViewInit {
  private isShowBtnsChart1 = true;
  private isShowBtnsChart2 = true;
  private isServicesChart = true;
  private minWidthShowBtns = 300;
  private lastWindowWidth = 0;
  private isInitialLoadChart1 = true;
  private isInitialLoadChart1b = true;
  private isInitialLoadChart2 = true;
  private divTooltip1 = null;
  private divTooltip1b = null;
  private divTooltip2 = null;
  private root = null;
  private treemap = null;
  private svg = null;
  private svgMargin = { top: 20, right: 20, bottom: 20, left: 20 };
  private widthChart1 = 0;
  private widthChart1b = 0;
  private durationMoveElement = 750;
  private durationFadeCharts = 2000;
  private durationFadeActivityChart = 1500;
  private durationFadeBubbleChart = 1250;
  private agentCoveredCnt = 5;
  private clrServicesNodeOutline = 'steelblue';
  private clrHighlight = 'lightsalmon';
  private clrRemoteHighlight = 'red';  // 'tomato';
  private strokewidthHighlight = '5';
  private clrTooltip = 'lightsalmon';
  private agentBubbleChart = '';

  // private isFirefox = navigator.userAgent.indexOf('Firefox') !== -1;
  // private isIE = (navigator.userAgent.indexOf('MSIE') !== -1 ) || (!!document.documentMode === true ); // IF IE > 10  // Doesn't work.

  /*
  * ## Static Functions ##
  */

  // Collapse a node and all it's children
  static collapse(d) {
    if (d.children) {
      d._children = d.children;
      d._children.forEach(ChartsComponent.collapse);
      d.children = null;
    }
  }

  // Expand a node and all it's children
  static expand(d) {
    const children = (d.children) ? d.children : d._children;
    if (d._children) {
      d.children = d._children;
      d._children = null;
    }
    if (children) {
      children.forEach(ChartsComponent.expand);
    }
  }

  /*
  * ## Functions ##
  */

  constructor() { }
  ngOnInit() { }
  ngOnDestroy() { }

  ngAfterViewInit() {
    this.lastWindowWidth = window.innerWidth;

    // Init Charts
    this.initChart1a(this);
    this.initChart1b(this);
    this.initChart2(this);

    // Draw Charts
    this.fadeCharts(false);
    if (this.isServicesChart) {
      this.drawChart1a(this);
    } else {
      this.drawChart1b(this);
    }
    this.drawChart2(this);
    this.fadeCharts(true);

    // Handle Resize of Charts
    const self = this;
    window.onresize = function (evt) {
      // Ignore height changes
      if (window.innerWidth === self.lastWindowWidth) { return; }
      self.lastWindowWidth = window.innerWidth;

      self.fadeCharts(false);
      if (self.isServicesChart) {
        self.drawChart1a(self);
      } else {
        self.drawChart1b(self);
      }
      self.drawChart2(self);
      self.fadeCharts(true);
    }
  }

  /*
  * ## Global Functions ##
  */

  private fadeCharts(isFadeIn: boolean) {
    if (isFadeIn) {
      // const duration = this.isServicesChart ? this.durationFadeServiceChart : this.durationFadeCharts;
      d3.select('#d3chart1').transition().duration(this.durationFadeCharts).style('opacity', 1);
//      d3.select('#d3chart2').transition().duration(this.durationFadeCharts).style('opacity', 1);
      d3.select('#d3chart2').transition().duration(0).style('opacity', 1);
    } else {
      d3.select('#d3chart1').style('opacity', 0);
      d3.select('#d3chart2').style('opacity', 0);
    }
  }

  private toggleChart() {
    this.isServicesChart = !this.isServicesChart;
    if (this.isServicesChart) {
      this.drawChart1a(this);
    } else {
      this.drawChart1b(this);
    }
  }

  private expand_all() {
    // console.log('expandAll()');
    ChartsComponent.expand(this.root);
    this.updateChart1a(this, this.root);
  }

  private collapse_all() {
    // console.log('collapseAll()');
    this.root.children.forEach(ChartsComponent.collapse);
    ChartsComponent.collapse(this.root);
    this.updateChart1a(this, this.root);
  }

  private hire_agent() {
    alert('Not implemented yet');
  }

  private remove_agent() {
    alert('Not implemented yet');
  }

  // Curved (diagonal) path from parent to child nodes
  private diagonal(s, d) {
    const path = `M ${s.y} ${s.x} C ${(s.y + d.y) / 2} ${s.x}, ${(s.y + d.y) / 2} ${d.x}, ${d.y} ${d.x}`
    return path;
  }

  // Toggle children on click
  private clickChart1a(ths, d) {
    ths.divTooltip1.style('opacity', 0);
    if (!(d.children || d._children)) { return; }
    if (d.children) {
      d._children = d.children;
      d.children = null;
    } else {
      d.children = d._children;
      d._children = null;
    }
    ths.updateChart1a(ths, d);
  }

  private contains(a, obj) {
    for (let i = 0; i < a.length; i++) {
      if (a[i] === obj) {
        return true;
      }
    }
    return false;
  }

  /*
   * ## Ontology Tree Chart ##
   *
   * Based on Collapsible Tree reading from JSON file:
   *   https://bl.ocks.org/mbostock/4339083, https://bl.ocks.org/d3noob/43a860bc0024792f8803bba8ca0d5ecd
   */

  /*
   * initChart1a()
   */
  private initChart1a(ths) {
    ths.isInitialLoadChart1 = false;
  }

  /*
   * drawChart1a()
   */
  private drawChart1a(ths) {
    const width = document.getElementById('d3chart1_card_block').clientWidth;
    const height = document.getElementById('d3chart1_card_block').clientHeight;
    const marginFactor = 0.85;
    ths.widthChart1 = width;
    // console.log('drawChart1: w=' + width + ', h=' + height);

    // Room for Card Footer buttons?
    ths.isShowBtnsChart1 = (width > ths.minWidthShowBtns) ? true : false;

    const fileJSON = './../../../assets/ontologies.json';

    // Clear out everything from the SVG element for this chart
    d3.select('#d3chart1').selectAll('*').remove();
    d3.select('#d3chart1_legend').selectAll('*').remove();

    // declares a tree layout and assigns the size
    this.treemap = d3.tree().size([height * marginFactor, width * marginFactor]);

    // Define div for tooltip
    if (ths.divTooltip1 === null) {
      ths.divTooltip1 = d3.select('body')
        .append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0);
    }

    // Set SVG client area size and position
    this.svg = d3.select('#d3chart1')
      // .attr('width', diameter)
      // .attr('transform', 'translate(' + x + ',' + y + ')')
      // // .attr('height', diameter)
      // .attr('class', 'bubble');
      .attr('width', width - (this.svgMargin.right + this.svgMargin.left))
      .attr('height', height - (this.svgMargin.top + this.svgMargin.bottom))
      .append('g')
      .attr('class', 'tree')
      .attr('transform', 'translate(' + this.svgMargin.left + ',' + this.svgMargin.top + ')')

    // Get the data and build the elements
    d3.json(fileJSON, function (error, treeData) {
      if (error) { throw error; }

      // Assigns parent, services, height, depth
      ths.root = d3.hierarchy(treeData, function (d: any) { return d.services; });
      // ths.root.x0 = height / 2;
      ths.root.x0 = height * 0.40;
      ths.root.y0 = 0;

      // Collapse after 2nd level
      ths.root.children.forEach(ChartsComponent.collapse);

      ths.updateChart1a(ths, ths.root);
    });

    // Legend
    const xLegend = 8, yLegend = 20, widthLegend = 145, heightLegend = 20;
    const svgLegend = d3.select('#d3chart1_legend');
    svgLegend.append('text').style('user-select', 'none').attr('x', xLegend).attr('y', yLegend - 6).
      text('Agent Coverage').style('font', 'normal arial');
    const clrScale = d3.scaleSequential(d3sc.interpolateRdYlBu).domain([0, ths.agentCoveredCnt]);
    const clrBar = svgLegend.append('g').style('user-select', 'none')
      .attr('transform', 'translate(' + xLegend + ',' + yLegend + ')')
      .call(d3cb.colorbarH(clrScale, widthLegend, heightLegend).tickValues([0, ths.agentCoveredCnt / 2, ths.agentCoveredCnt]));

    d3.select(self.frameElement).style('height', height + 'px');
  }  /* End drawChart1 */

  /*
   * updateChart1a()
   */
  private updateChart1a(ths, source) {
    // Assigns the x and y position for the nodes
    const treeData = this.treemap(ths.root);

    // Compute the new tree layout
    const nodes = treeData.descendants();
    const links = treeData.descendants().slice(1);

    // Horizontal spacing for each level. Normalize for fixed-depth
    nodes.forEach(function (d) {
      // console.log('depth=' + d.depth);
      d.y = ths.svgMargin.left + (d.depth * ((ths.widthChart1 / 3) - (ths.svgMargin.left + ths.svgMargin.right)));
    });

    // *** Nodes section ****

    // Update the nodes...
    const node = this.svg.selectAll('#d3chart1 g.node')
      .data(nodes, function (d: any) { return d.id; });

    // Enter any new nodes at the parent's previous position
    const nodeEnter = node.enter().append('g')
      .attr('class', 'node')
      .attr('transform', function (d) { return 'translate(' + source.y0 + ',' + source.x0 + ')'; })
      .on('click', function (d) {
        ths.clickChart1a(ths, d);
      });

    // Add Circle for the nodes
    nodeEnter.append('circle')
      .attr('class', 'c1_circle')
      .attr('r', 1e-6)
      .on('mouseover', (d) => { mouseOver(ths, d); })
      .on('mouseout', (d) => { mouseOut(ths, d); });

    // Add label shadows for the nodes (Places left or right depending on whether node has children or not)
    nodeEnter.append('text')
      .attr('class', 'text')
      .style('user-select', 'none')
      .attr('dy', '.35em')
      .attr('x', function (d) { return d.children || d._children ? -18 : 18; })
      .attr('text-anchor', function (d) { return d.children || d._children ? 'end' : 'start'; })
      .style('stroke-width', ths.strokewidthHighlight)
      .style('stroke', '#fff')
      .text(function (d: any) {
        // const text = d.data.id.substring(0, 8);
        // return text.length < d.data.id.length ? text + '...' : text;
        if (d.depth === 0) { return ''; }
        const text = d.data.description.substring(0, 20);
        return text.length < d.data.description.length ? text + '...' : text;
      });
    // .style('fill-opacity', 1e-6);

    // Add labels for the nodes (Places left or right depending on whether node has children or not)
    nodeEnter.append('text')
      .attr('class', 'text')
      .style('user-select', 'none')
      .attr('dy', '.35em')
      .attr('x', function (d) { return d.children || d._children ? -18 : 18; })
      .attr('text-anchor', function (d) { return d.children || d._children ? 'end' : 'start'; })
      .text(function (d: any) {
        // const text = d.data.id.substring(0, 8);
        // return text.length < d.data.id.length ? text + '...' : text;
        if (d.depth === 0) { return ''; }
        const text = d.data.description.substring(0, 20);
        return text.length < d.data.description.length ? text + '...' : text;
      });
    // .style('fill-opacity', 1e-6);

    const pxOffset = '0.3em';
    // if (ths.isIE) {
    //   pxOffset = '??';
    // }

    // Add children indicator shadow if node has children
    nodeEnter.append('text')
      .style('pointer-events', 'none')  // Don't eat mouseovers.
      .style('user-select', 'none')
      .attr('text-anchor', 'middle')
      // .attr('dominant-baseline', 'central')
      .attr('dy', function () { return pxOffset; })
      .style('font', 'ariel')
      .style('font-weight', 'bold')
      .style('font-size', '20px')
      .style('stroke-width', '2.5')
      .style('stroke', '#fff')
      .text(function (d) { return d.children || d._children ? '+' : ''; });

    // Add children indicator if node has children
    nodeEnter.append('text')
      .style('pointer-events', 'none')  // Don't eat mouseovers.
      .style('user-select', 'none')
      .attr('text-anchor', 'middle')
      // .attr('dominant-baseline', 'central')
      .attr('dy', function () { return pxOffset; })
      .style('font', 'ariel')
      .style('font-weight', 'bold')
      .style('font-size', '20px')
      // .style('fill', 'white')
      // .style('font-family', 'FontAwesome')
      // .text(function(d) { return '\uf196' });  // fa-plus-square-o.
      .text(function (d) { return d.children || d._children ? '+' : ''; });

    // *** Update ***
    const nodeUpdate = nodeEnter.merge(node);

    // Transition nodes to their new position
    nodeUpdate.transition()
      .duration(ths.durationMoveElement)
      .attr('transform', function (d) { return 'translate(' + d.y + ',' + d.x + ')'; });

    // Update the node attributes and style
    nodeUpdate.select('#d3chart1 circle') // 'circle.node'
      .attr('r', 12)
      .style('font', '12px sans-serif')
      .style('fill', function (d) {
        if (d.depth === 0) {
          return '#fff';
        } else {
          const scale = d3.scaleLinear().domain([0, ths.agentCoveredCnt]).range([0, 1]);
          const clr = d3sc.interpolateRdYlBu(scale(d.data.agents ? d.data.agents.length : 0));
          return clr;
        }
      })
      .style('stroke', ths.clrServicesNodeOutline)
      .style('stroke-width', '3')
      .attr('cursor', function(d) { return d.children || d._children ? 'pointer' : 'default' });

    nodeUpdate.select('#d3chart1 text')
      .style('fill-opacity', 1);

    // Transition exiting nodes to the parent's new position (Remove exiting nodes)
    const nodeExit = node.exit().transition()
      .duration(ths.durationMoveElement)
      .attr('transform', function (d) { return 'translate(' + source.y + ',' + source.x + ')'; })
      .remove();

    // On exit reduce the node circles size to effectively 0
    nodeExit.select('#d3chart1 circle')
      .attr('r', 1e-6);

    // On exit reduce the opacity of text labels to effectively hidden
    nodeExit.select('#d3chart1 text')
      .style('fill-opacity', 1e-6);

    // *** Links section ***

    // Update the links...
    const link = this.svg.selectAll('#d3chart1 path.link')
      .data(links, function (d: any) { return d.id; });

    // Enter any new links at the parent's previous position
    const linkEnter = link.enter().insert('path', 'g')
      .attr('class', 'link')
      .attr('stroke', 'black')
      .attr('stroke-width', '2px')
      .attr('shape-rendering', 'auto')
      .attr('fill', 'none')
      .attr('d', function (d) {
        const o = { x: source.x0, y: source.y0 };
        return ths.diagonal(o, o);
      });
    // .attr('d', d3.linkHorizontal().x(function (d: any) { return d.y; }).y(function (d: any) { return d.x; }));

    // *** Update ***
    const linkUpdate = linkEnter.merge(link);

    // Transition links back to parent element position
    linkUpdate.transition()
      .duration(ths.durationMoveElement)
      .attr('d', function (d) { return ths.diagonal(d, d.parent) });
    // .attr('d', d3.linkHorizontal().x(function (d: any) { return d.y; }).y(function (d: any) { return d.x; }));

    // Transition exiting nodes to the parent's new position (remove any exiting links)
    const linkExit = link.exit().transition()
      .duration(ths.durationMoveElement)
      .attr('d', function (d) {
        const o = { x: source.x, y: source.y };
        return ths.diagonal(o, o);
      })
      // .attr('d', d3.linkHorizontal().x(function (d: any) { return d.y; }).y(function (d: any) { return d.x; }))
      .remove();

    // Stash the old positions for transition
    nodes.forEach(function (d) {
      d.x0 = d.x;
      d.y0 = d.y;
    });

  // tslint:disable-next-line:no-shadowed-variable
  function mouseOver(ths, d: any) {
    if (!ths.isServicesChart) { return; }
    d3.selectAll('.c1_circle')
      .style('stroke', function (o: any) {
        return d.data.id === o.data.id ? ths.clrHighlight : ths.clrServicesNodeOutline;
      });

    /* Chart interactivity: Highlight matching agents in Chart2 - Bubble Chart */
    d.data.agents.forEach(function (o, i) {
      const agent = o;
      d3.selectAll('.c2_circle')
        .style('stroke', function (p: any) {
          return agent === p.data.address ? ths.clrRemoteHighlight : 'white';
        }).style('stroke-width', function (p: any) {
          return agent === p.data.address ? ths.strokewidthHighlight : '1';
        });
    });
    /* End chart interactivity */

    ths.divTooltip1.style('opacity', .9);
    ths.divTooltip1.html(
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
  };

  // tslint:disable-next-line:no-shadowed-variable
  function mouseOut(ths, d: any) {
    d3.selectAll('.c1_circle')
      .style('stroke', ths.clrServicesNodeOutline)
      .style('stroke-width', '3');
    ths.divTooltip1.style('opacity', 0);

    /* Chart interactivity: Revert highlighting in other chart */
    d3.selectAll('.c2_circle')
      .style('stroke', 'white')
      .style('stroke-width', '1');
    /* End chart interactivity */
  };

  function buildNodeTooltipHTML(d, verbose) {
      const headText = (d.data.id === null || d.data.id === '') ? d.data.description : d.data.description + '<hr>' + d.data.id;

      if (verbose) {
        const agentCount = d.data.agents ? d.data.agents.length : 0;
        const serviceCount = d.data.services ? d.data.services.length : 0;

        return '<div class=\'node-detailed-tooltip\'> <table class=\'table\'> <thead> <tr> <th colspan=\'2\'>' + headText +
          '</th> </tr> </thead> <tbody> <tr> <td class=\'collapsing\'> <span>Agent Count</span> </td> <td>' + agentCount +
          '</td> </tr> <tr> <td> <span>Service Count</span> </td> <td>' + serviceCount +
          // '</td> </tr> <tr> <td> <span>TODO</span> </td> <td>' + d.data.TODO +
          '</td> </tr> </tbody> </table> </div>';
      } else {
        return '<div class=\'node-tooltip\'> <table class=\'table\'> <tbody> <tr> <td nowrap>' + headText +
          '</td> </tr> </tbody> </table> </div>';
      }
    }
  }  /* End of updateChart1a() */

  /*
   * ## Agents Activity Bar Chart ##
   *
   * Based on Stacked Bar Charts w/time scale reading from JSON file: http://bl.ocks.org/anupsavvy/9513382
   */

  /*
   * initChart1b()
   */
  private initChart1b(ths) {
    ths.isInitialLoadChart1b = false;
  }

  /*
   * drawChart1b()
   *
   * Started with this Stacked Bar https://bl.ocks.org/mbostock/b5935342c6d21928111928401e2c8608
   *
   */
  private drawChart1b(ths) {
    const marginFactor = 0.85;
    const width = document.getElementById('d3chart1_card_block').clientWidth * marginFactor;
    const height = document.getElementById('d3chart1_card_block').clientHeight * marginFactor;
    // const diameter = Math.min(width, height);
    // console.log('drawChart1b: w=' + width + ', h=' + height);

    let barRects = null;

    // Room for Card Footer buttons?
    ths.isShowBtnsChart1 = false; // (width > ths.minWidthShowBtns) ? true : false;

    const fileJSON = './../../../assets/activity.executed.json';

    // Clear out everything from the SVG element for this chart
    d3.select('#d3chart1').selectAll('*').remove();
    d3.select('#d3chart1_legend').selectAll('*').remove();

    // Get the data and build the elements
    d3.json(fileJSON, function (error, data: any) {
      if (error) { throw error; }

      // Keys: Extract unique agents from data
      const keys = [];
      for (let i = 0; i < data.length; i++) {
        const obj = data[i]
        for (const key in obj) {
          // console.log(key + '=' + obj[key]);
          if (key !== 'date' && (keys.indexOf(key) === -1)) {
              keys.push(key);
              // console.log('push(' + key + ')');
          }
        }
      }

      // Construct chart series with data and keys
      const series = d3.stack()
        .keys(keys)
        (data);

      ths.svg = d3.select('#d3chart1')
        // .attr('width', width - (this.svgMargin.right + this.svgMargin.left))
        // .attr('height', height - (this.svgMargin.top + this.svgMargin.bottom))
        .attr('width', width)
        .attr('height', height)
        .attr('class', 'stack')
        // .attr('transform', 'translate(' + this.svgMargin.left + ',' + this.svgMargin.top + ')')
        .attr('transform', 'translate(' + ths.svgMargin.left + ',' + ths.svgMargin.top + ')')

      // const margin = this.svgMargin;
      const margin = { top: 20, right: 30, bottom: 45, left: 50 };

      // Configure X scale
      const x = d3.scaleBand()
        .domain(data.map(function (d) { return d.date; }))
        .rangeRound([margin.left, width - margin.right])
        .padding(0.4);

      // Configure Y scale
      const min: any = d3.min(series, stackMin);
      const max: any = d3.max(series, stackMax);
      const y = d3.scaleLinear()
        .domain([min, max])
        .rangeRound([height - margin.bottom, margin.top]);

      // Configure Z scale (colors)
      const z = d3.scaleOrdinal(d3.schemeCategory20c);

      // Bars
      barRects = ths.svg.append('g')
        .selectAll('g')
        .data(series)
        .enter().append('g')
        .attr('fill', function (d) { return z(d.key); })
        .selectAll('rect')
        .data(function (d) { return d; })
        .enter().append('rect')
        // .attr('class', 'c1b_rect')
        .attr('class', function (d) {
          const pDatum: any = d3.select(this.parentNode).datum();
          const classnames = 'c1b_rect' + ' A' + pDatum.key;  // Classnames can't start with a digit.
          return classnames;
        })
        .attr('width', x.bandwidth)
        .attr('x', function (d: any) { return x(d.data.date); })
        // .attr('y', function (d) { return y(d[1]); })
        .attr('y', function (d) { return y(d[0]); })  // Start bar segment at bottom. Will transition to top.
        // .attr('height', function (d) { return y(d[0]) - y(d[1]); })
        .attr('height', 0)  // Start at 0 height. Will transition to actual height.
        .on('mouseover', function (d: any) {
          const pDatum: any = d3.select(this.parentNode).datum();
          mouseOver(ths, d, pDatum);
        })
        .on('mouseout', (d) => { mouseOut(ths, d); });

      // X Axis
      ths.svg.append('g')
        .attr('transform', 'translate(0,' + y(0) + ')')
        .call(d3.axisBottom(x))
        .selectAll('text')
        .style('user-select', 'none')
        .attr('y', 0)
        .attr('x', 9)
        .attr('dy', '.35em')
        .attr('transform', 'rotate(45)')
        .style('text-anchor', 'start');

      // Y Axis
      ths.svg.append('g')
        .style('user-select', 'none')
        .attr('transform', 'translate(' + margin.left + ',0)')
        .call(d3.axisLeft(y));

      // Bar segment transition to make bar sections appear, ending with the correct height
      barRects.transition()
      // .delay(50)
      .duration(ths.durationFadeActivityChart)
      .attr('height', function (d: any) { return y(d[0]) - y(d[1]); })
      .attr('y', function (d) { return y(d[1]); });
    });

    // Legend
    const xLegend = 10, yLegend = 30, widthLegend = 150, heightLegend = 20;
    const svgLegend = d3.select('#d3chart1_legend');
    svgLegend.append('text').attr('x', xLegend).attr('y', yLegend - 6).text('Executed Contracts')
      .style('user-select', 'none')
      .style('font', 'normal arial')
      .style('font-size', '1rem');
    svgLegend.append('text').attr('x', xLegend + 35).attr('y', yLegend + 12).text('by Agent')
      .style('user-select', 'none')
      .style('font', 'normal arial')
      .style('font-size', '1rem');

    d3.select(self.frameElement).style('height', height + 'px');

    function stackMin(serie) {
      return d3.min(serie, function (d) { return d[0]; });
    }

    function stackMax(serie) {
      return d3.max(serie, function (d) { return d[1]; });
    }

    // tslint:disable-next-line:no-shadowed-variable
    function mouseOver(ths, d: any, pDatum) {
      d3.selectAll('.c1b_rect')
        .style('opacity', function (o: any) {
          return d.data.date === o.data.date && d[1] === o[1] ? 0.6 : 1;
        });

      /* Chart interactivity: Highlight matching agents in Chart2 - Bubble Chart */
      const agent = pDatum.key;
      d3.selectAll('.c2_circle')
        .style('stroke', function (o: any) {
          return agent === o.data.address ? ths.clrRemoteHighlight : 'white';
        }).style('stroke-width', function (o: any) {
          return agent === o.data.address ? ths.strokewidthHighlight : '1';
        });
      /* End chart interactivity */

      ths.divTooltip2.style('opacity', .9);
      ths.divTooltip2.html(
        buildNodeTooltipHTML(d, pDatum, true))
        .style('pointer-events', 'none')  // Else the hidden tooltip can eat mouseovers.
        .style('left', (d3.event.pageX + 12) + 'px')
        .style('top', (d3.event.pageY - 12) + 'px')
        .style('position', 'absolute')
        .style('text-align', 'center')
        .attr('width', '60px')
        .attr('height', '28px')
        .style('padding', '6px')
        .style('font', '12px sans-serif;')
        .style('background', ths.clrTooltip)
        .style('border', '0px')
        .style('border-radius', '8px')
        .style('box-shadow', '5px 5px 5px rgba(0, 0, 0, 0.1');
    };

    // tslint:disable-next-line:no-shadowed-variable
    function mouseOut(ths, d: any) {
      d3.selectAll('.c1b_rect')
        .style('opacity', 1);
      ths.divTooltip2.style('opacity', 0);

      /* Chart interactivity: Revert highlighting in other chart */
      d3.selectAll('.c2_circle')
        .style('stroke', 'white')
        .style('stroke-width', '1');
      /* End chart interactivity */
    };

    function buildNodeTooltipHTML(d, datum, verbose) {
      const agent = datum.key;
      const value = d.data[agent];
      // console.log('Agent=' + agent + ', value=' + value);

      return '<div class=\'node-tooltip\'> <table class=\'table\'> <tbody> <tr> <td nowrap>' + '<b>' + agent
        + '</b>' + '<hr>' + value + ' Executed Contracts' + '</td> </tr> </tbody> </table> </div>';
    }
  }  /* End drawChart1b() */

  /*
   * ## Agents Bubble Chart ##
   *
   * Based on Bubble Chart reading from JSON file: https://bl.ocks.org/john-guerra/0d81ccfd24578d5d563c55e785b3b40a
   */

  /*
   * initChart2()
   */
  private initChart2(ths) {
    ths.isInitialLoadChart2 = false;
  }

  /*
   * drawChart2()
   */
  private drawChart2(ths) {
    const width = document.getElementById('d3chart2_card_block').clientWidth;
    const height = document.getElementById('d3chart2_card_block').clientHeight;
    const marginFactor = 0.90;
    const diameter = Math.min(width, height);
    let nodes = null, circles = null, labels = null;
    // console.log('drawChart2: w=' + width + ', h=' + height + ', d=' + diameter);

    // Room for Card Footer buttons?
    ths.isShowBtnsChart2 = (width > ths.minWidthShowBtns) ? true : false;

    const fileJSON = './../../../assets/agents.lg.json';  // agents.sm.json, agents.md.json, agents.lg.json.

    // Clear out everything from the SVG element for this chart
    d3.select('#d3chart2').selectAll('*').remove();

    // Pack bubbles
    const bubble = d3.pack()
      // TODO: breaks overall bubble pack layout resizing
      // .radius(function (d: any) {
      //   const minValue = 50;  // Min bubble size.
      //   return (d.value < minValue) ? Math.sqrt(minValue) : Math.sqrt(d.value);
      // })
      .size([diameter * marginFactor, diameter * marginFactor])
      .padding(2);

    // Define div for tooltip
    if (ths.divTooltip2 === null) {
      ths.divTooltip2 = d3.select('body')
        .append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0);
    }

    // Set SVG client area size and position
    const x = (width - diameter) / 2, y = (height - diameter) / 2;
    const svg = d3.select('#d3chart2')
      .attr('width', diameter)
      .attr('transform', 'translate(' + x + ',' + y + ')')
      // .attr('height', diameter)
      .attr('class', 'bubble');

    // Get the data and build the elements
    d3.json(fileJSON, function (error, data) {
      if (error) { throw error; }

      const root = d3.hierarchy(classes(data))
        .sum(function (d: any) { return d.value; })
        .sort(function (a, b) { return b.value - a.value; });

      bubble(root);
      nodes = svg.selectAll('.c2_node')
        .data(root.children)
        .enter().append('g')
        .attr('class', 'c2_node')
        .attr('transform', function (d: any) { return 'translate(' + d.x + ',' + d.y + ')'; });

      circles = nodes.append('circle')
        .attr('class', 'c2_circle')
        .attr('r', 0)  // Start at 0 radius. Will transition to actual radius.
        .attr('cx',  function (d: any) { return d.cx; })
        .attr('cy',  function (d: any) { return d.cy; })
        .style('fill', function (d: any) {
          // d3.select(this).attr('color-val', d.data.rating_avg.toString());
          const clr = d3sc.interpolateRdYlBu(d.data.rating_avg);
          // d.data.colorval = bubbleClr;
          return clr;
        })
        .on('mouseover', (d) => { mouseOver(ths, d); })
        .on('mouseout', (d) => { mouseOut(ths, d); });

      labels = nodes.append('text')
        .style('font', 'ariel')
        .style('font-weight', 'bold')
        // .style('fill', 'white')
        .attr('dy', '.3em')
        .style('text-anchor', 'middle')
        .style('pointer-events', 'none')
        .style('user-select', 'none')
        .style('opacity', '0')  // Start hidden. Will transition to visible.
        .text(function (d: any) {
          if (d.r < 14) { return ''; }
          const id = d.data.address.substring(0, d.r / 7);
          return id.length < d.data.address.length ? id + '...' : id;
        });

      // Radius transition to make bubbles appear, ending with the correct radius
      circles.transition()
        .delay(50)
        .duration(ths.durationFadeBubbleChart)
        .attr('r', function (d: any) { return d.r; })

      // Opacity transition to make bubble labels appear, ending with full visibility
      labels.transition()
        .delay(Math.max(ths.durationFadeBubbleChart - 500, 0))
        .duration(500)
        .style('opacity', '1');
    });

    // Legend
    const xLegend = 8, yLegend = 20, widthLegend = 145, heightLegend = 20;
    const svgLegend = d3.select('#d3chart2_legend');
    svgLegend.append('text').style('user-select', 'none').attr('x', xLegend).attr('y', yLegend - 6)
      .text('Agent Rating').style('font', 'normal arial');
    const clrScale = d3.scaleSequential(d3sc.interpolateRdYlBu).domain([0, 1]);
    const clrBar = svgLegend.append('g')
      .style('user-select', 'none')
      .attr('transform', 'translate(' + xLegend + ',' + yLegend + ')')
      .call(d3cb.colorbarH(clrScale, widthLegend, heightLegend).tickValues([0, 0.5, 1]));

    d3.select(self.frameElement).style('height', diameter + 'px');

    // tslint:disable-next-line:no-shadowed-variable
    function mouseOver(ths, d: any) {
      d3.selectAll('.c2_circle')
        .style('stroke', function (o: any) {
          return d.data.address === o.data.address ? ths.clrHighlight : 'white';
        }).style('stroke-width', function (o: any) {
          return d.data.address === o.data.address ? ths.strokewidthHighlight : '1';
        });

      /* Chart interactivity: Highlight matching agents... */
      if (ths.isServicesChart) {
        // ...in Chart1 - Services Ontology Tree Chart
        ths.agentBubbleChart = d.data.address;  // Work-around: const agentBubbleChart = d.data.address;
        // console.log('agentBubbleChart (d.data.address)=', ths.agentBubbleChart);
        const __this = ths;
        d3.selectAll('.c1_circle').each(function (o: any, i) {
          o.data.agents.forEach(function (p: any) {
            d3.selectAll('.c1_circle').
              style('stroke', function (q: any) {
                // const match = q.data.agents.includes(ths.agentBubbleChart);  // Doesn't work in IE.
                const match = ths.contains(q.data.agents, ths.agentBubbleChart);
                return match ? ths.clrRemoteHighlight : ths.clrServicesNodeOutline;
              });
              d3.selectAll('.c1_circle').
              style('stroke-width', function (q: any) {
                // const match = q.data.agents.includes(ths.agentBubbleChart);  // Doesn't work in IE.
                const match = ths.contains(q.data.agents, ths.agentBubbleChart);
                return match ? ths.strokewidthHighlight : '3';
              });
          });
        });
      } else {
        // ...in Chart1b - Activities Stacked Bar Chart
        const agent = d.data.address;
        const agentClass = '.A' + agent;
        d3.selectAll(agentClass).style('opacity', 0.2);
      }
      /* End chart interactivity */

      ths.divTooltip2.style('opacity', 0.9);
      ths.divTooltip2.attr('pagex', d3.event.pageX).attr('pagey', d3.event.pageY);  // Workaround.
      ths.divTooltip2.html(
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
        .style('background', ths.clrTooltip)
        .style('border', '0px')
        .style('border-radius', '8px')
        .style('box-shadow', '5px 5px 5px rgba(0, 0, 0, 0.1');
    };

    // tslint:disable-next-line:no-shadowed-variable
    function mouseOut(ths, d: any) {
      /* Chart interactivity: Revert highlighting in other chart */
      if (ths.isServicesChart) {
        d3.selectAll('.c1_circle')
        .style('stroke', ths.clrServicesNodeOutline)
        .style('stroke-width', '3')
      } else {
        d3.selectAll('.c1b_rect').style('opacity', 1)
      }
      /* End chart interactivity */

      d3.selectAll('.c2_circle')
        .style('stroke', 'white')
        .style('stroke-width', '1');
      ths.divTooltip2.style('opacity', 0);
    };

    function buildNodeTooltipHTML(d, verbose) {
      const headText = (d.data.description === '') ? d.data.address : d.data.description + '<hr>' + d.data.address;

      if (verbose) {
        const wealthFormat = d3.format(',.8f');
        const wealthText = wealthFormat(d.data.wealth) + ' AGI';
        const pendContracts = d.data.pend_contracts ? d.data.pend_contracts.length : 0;
        const execContracts = d.data.exec_contracts ? d.data.exec_contracts.length : 0;

        return '<div class=\'node-detailed-tooltip\'> <table class=\'table\'> <thead> <tr> <th colspan=\'2\'>'
          + headText + '</th> </tr> </thead> <tbody> <tr> <td class=\'collapsing\'> <span>Wealth</span> </td> <td>'
          + wealthText + '</td> </tr> <tr> <td> <span>Rating Count</span> </td> <td>' + d.data.rating_cnt
          + '</td> </tr> <tr> <td> <span>Rating Average</span> </td> <td>' + d.data.rating_avg
          + '</td> </tr> <tr> <td> <span>Pending Contract Count</span> </td> <td>' + pendContracts
          + '</td> </tr> <tr> <td> <span>Executed Contract Count</span> </td> <td>' + execContracts
          // '</td> </tr> <tr> <td> <span>TODO</span> </td> <td>' + d.data.TODO +
          + '</td> </tr> </tbody> </table> </div>';
      } else {
        return '<div class=\'node-tooltip\'> <table class=\'table\'> <tbody> <tr> <td nowrap>' + headText +
          '</td> </tr> </tbody> </table> </div>';
      }
    }

    // Returns a flattened hierarchy containing all leaf nodes under the root.
    function classes(root) {
      const classes = [];

      function recurse(name, nde) {
        if (nde.agents) {
          nde.agents.forEach(function (child) { recurse(nde.agents, child); });
        } else {
          classes.push({
            value: nde.wealth, address: nde.address, description: nde.description, wealth: nde.wealth,
            rating_avg: nde.rating.average, rating_cnt: nde.rating.count, services: nde.services,
            exec_contracts: nde.executedContracts, pend_contracts: nde.pendingContracts
          });
        }
      }

      recurse(null, root);
      return { children: classes };
    }
  }  /* End drawChart2() */
}
