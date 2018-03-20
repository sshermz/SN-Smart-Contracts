import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { ViewEncapsulation } from '@angular/core';
import { routerTransition } from '../../router.animations';
import { interpolateRdYlBu } from 'd3-scale-chromatic';
import { colorbarH } from 'd3-colorbar';
import * as d3 from 'd3';

/*
 * ## Class ChartsComponent ##
 */
@Component({
  selector: 'app-charts',
  templateUrl: './charts.component.html',
  styleUrls: ['./charts.component.scss'],
  animations: [routerTransition()],
  encapsulation: ViewEncapsulation.None,  // Enable styles against innerHTML/deep (dynamic) elements via scss file.
})
export class ChartsComponent implements OnInit, OnDestroy, AfterViewInit {
  static result: boolean;
  private isShowBtnsChart1a = true;
  private isShowBtnsChart1b = false;
  private isShowBtnsChart2 = true;
  private isServicesChart = true;
  private isSelectionChart1a = false;
  private selectionDataChart1a = null;
  private selectionAgentListChart1a = null;
  // private isSelectionChart1b = false;
  // private selectionDataChart1b = null;
  // private isSelectionChart2 = false;
  // private selectionDataChart2 = null;
  private dataChart2 = null;
  private bubble = null;
  private minWidthShowBtns = 300;
  private lastWindowWidth = 0;
  private isInitialLoadChart1a = true;
  private isInitialLoadChart1b = true;
  private isInitialLoadChart2 = true;
  private divTooltip1a = null;
  private divTooltip1b = null;
  private divTooltip2 = null;
  private marginTT = 30;
  private opacityTT = 0.92;
  private root = null;
  private treemap = null;
  private svg = null;
  private svgMargin = { top: 0, right: 20, bottom: 20, left: 20 };
  private widthChart1 = 0;
  private durationMoveElement = 750;
  private durationFadeCharts = 2000;
  private durationFadeActivityChart = 1500;
  private durationFadeBubbleChart = 1250;
  private arrAgents = [];
  private agentMaxCoveredCnt = 15;
  private serviceMaxPendCnt = 15;
  private serviceMaxFullyExpandedNodesCount = 50;
  private clrServicesNodeOutline = 'steelblue';
  private clrHighlight = 'lightsalmon';
  private strokeHighlight = 5;
  private strokeServiceHighlight = 3;
  private strokeServicesNodeSelected = 5;
  private strokeServicesNodeOutline = 3;
  private clrSelected = 'dimgrey';
  private clrTooltip = 'lightsalmon';
  private font;
  private fontsize;
  private isFirefox = navigator.userAgent.indexOf('Firefox') !== -1;

  /*
  * ## Static Functions ##
  */

  // Collapse a node
  private static collapseNode(d) {
    d._children = d.children;
    d.children = null;
  }

  // Expand a node
  private static expandNode(d) {
    d.children = d._children;
    d._children = null;
  }

  // Collapse a node and all it's children
  private static collapseNodesRecursive(d) {
    if (d.children) {
      d._children = d.children;
      d._children.forEach(ChartsComponent.collapseNodesRecursive);
      d.children = null;
    }
  }

  // Expand a node and all it's children
  private static expandNodesRecursive(d) {
    const children = (d.children) ? d.children : d._children;
    if (d._children) {
      d.children = d._children;
      d._children = null;
    }
    if (children) {
      children.forEach(ChartsComponent.expandNodesRecursive);
    }
  }

  // Test if node is expanded or not
  private static isNodeCollapsed(d): boolean {
    if (d.children) {
      return false;
    } else {
      return true;
    }
  }

  // Test if node and children fully expanded or not
  private static isNodeExpandedRecursive(d): boolean {
    if (d._children) {
      return false;
    } else if (d.children) {
      for (let i = 0; i < d.children.length; i++) {
        this.result = ChartsComponent.isNodeExpandedRecursive(d.children[i]);
        if (this.result === false) { break; }
      }
      return this.result;
    }
    return true;
  }

  // Sort nodes
  private static sortNodes(d) {
    if (d.children) {
      d.children.sort(function (a, b) {
        return a.data.description.toUpperCase().localeCompare(b.data.description.toUpperCase());
      })
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
    this.font = this.isFirefox ? 'sans-serif' : 'Open Sans';  // Open Sans not working on FF.
    this.fontsize = this.isFirefox ? 12 : 13.5;

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
    const _this = this;
    window.onresize = function (evt) {
      if (window.innerWidth === _this.lastWindowWidth) { return; }  // Ignore height changes.
      _this.lastWindowWidth = window.innerWidth;  // Save last width.

      _this.fadeCharts(false);
      if (_this.isServicesChart) {
        _this.drawChart1a(_this);
      } else {
        _this.drawChart1b(_this);
      }
      _this.drawChart2(_this);
      _this.fadeCharts(true);
    }
  }

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

  private toggleChart1() {
    this.isServicesChart = !this.isServicesChart;
    if (this.isServicesChart) {
      this.drawChart1a(this);
    } else {
      // If there was a selection in Services chart, cancel it
      if (this.isSelectionChart1a) {
        this.isSelectionChart1a = false;
        this.selectionDataChart1a = this.selectionAgentListChart1a = null;
        this.drawChart2(this);
      }

      this.drawChart1b(this);
    }
  }

  // Collapse all nodes
  private leftBtnChart1() {
    if (this.isServicesChart) {
      if (this.root.children) {
        ChartsComponent.collapseNodesRecursive(this.root);
        this.updateChart1a(this, this.root);

        // If there was a selection in Services chart, cancel it
        if (this.isSelectionChart1a) {
          this.isSelectionChart1a = false;
          this.selectionDataChart1a = this.selectionAgentListChart1a = null;
          this.drawChart2(this);
        }
      }
    }
  }

  // Expand all nodes
  private rightBtnChart1() {
    if (this.isServicesChart) {
      if (!ChartsComponent.isNodeExpandedRecursive(this.root)) {
        ChartsComponent.expandNodesRecursive(this.root);
        this.updateChart1a(this, this.root);
      }
    }
  }

  private leftBtnChart2() {
    alert('Not implemented yet');
  }

  private rightBtnChart2() {
    alert('Not implemented yet');
  }

  // Curved (diagonal) path from parent to child nodes
  private diagonal(s, d) {
    // return 'M ' + s.y + ' ' + s.x + ' C ' + (s.y + d.y) / 2 + ' ' + s.x + ','
    //  + ' ' + (s.y + d.y) / 2 + ' ' + d.x + ',' + ' ' + d.y + ' '  + d.x;
    return `M ${s.y} ${s.x} C ${(s.y + d.y) / 2} ${s.x}, ${(s.y + d.y) / 2} ${d.x}, ${d.y} ${d.x}`;
  }

  private index(array, obj) {
    if (!array) { return -1; }
    for (let i = 0; i < array.length; i++) {
      if (array[i] === obj) {
        return i;
      }
    }
    return -1;
  }

  private indexByField(array, array_field, obj) {
    if (!array) { return -1; }
    for (let i = 0; i < array.length; i++) {
      if (array[i][array_field] === obj) {
        return i;
      }
    }
    return -1;
  }

  /*
   * ## Chart1a: Services Ontology Tree Chart ##
   */

  /*
   * initChart1a()
   */
  private initChart1a(ths) {
    ths.isInitialLoadChart1a = false;

    // Define div for tooltip
    if (ths.divTooltip1a === null) {
      ths.divTooltip1a = d3.select('body')
        .append('div')
        .attr('class', 'd3tooltip')
        .style('opacity', 0);
    }
  }

  /*
   * drawChart1a()
   */
  private drawChart1a(ths) {
    const width = document.getElementById('d3chart1_card_block').clientWidth;
    const height = document.getElementById('d3chart1_card_block').clientHeight;
    const marginFactor = 0.90;
    ths.widthChart1 = width;
    // console.log('drawChart1: w=' + width + ', h=' + height);

    ths.isShowBtnsChart1b = false;
    ths.isShowBtnsChart1a = (width > ths.minWidthShowBtns) ? true : false;

    const fileJSON = './../../../assets/ontologies.json';

    // declares a tree layout and assigns the size
    this.treemap = d3.tree().size([height * marginFactor, width * marginFactor]);

    // Get the data and build the elements
    d3.json(fileJSON, function (error, data: any) {
      if (error) { throw error; }

      // Add root node for d3.hierarchy
      const treeData: any = { id: '', description: 'Services', agents: [], services: data };

      // Parse data into d3 hierarchy, assigning parent, services, height, depth
      ths.root = d3.hierarchy(treeData, function (d: any) { return d.services; })
        .sort(function (a, b) {  // Sort agents.
           return a.data.description.toUpperCase().localeCompare(b.data.description.toUpperCase());
          });

      // Root node position
      ths.root.x0 = height * 0.40;
      ths.root.y0 = 0;

      // Sort services
      ths.root.children.forEach(ChartsComponent.sortNodes);

      // Get count of all nodes
      const cntNodes = ths.root.count().value;
      // console.log('Services Ontology Chart: Services Count=' + cntNodes);

      // If large number of nodes, collapse after 2nd level
      if (cntNodes > ths.serviceMaxFullyExpandedNodesCount) {
        ths.root.children.forEach(ChartsComponent.collapseNode);
      }

      // Clear out everything from the SVG element for this chart
      d3.select('#d3chart1').selectAll('*').remove();
      d3.select('#d3chart1_legend').selectAll('*').remove();

      // Set SVG client area size and position
      ths.svg = d3.select('#d3chart1')
        .attr('width', width - (ths.svgMargin.right + ths.svgMargin.left))
        .attr('height', height - (ths.svgMargin.top + ths.svgMargin.bottom))
        .append('g')
        .attr('class', 'c1a_tree')
        .attr('transform', 'translate(' + ths.svgMargin.left + ',' + ths.svgMargin.top + ')')

      // Legend
      const xLegend = 8, yLegend = 20, wLegend = 145, hLegend = 20;
      const svgLegend = d3.select('#d3chart1_legend');
      svgLegend.append('text').style('user-select', 'none')
        // .attr('x', xLegend).attr('y', yLegend - 6)  // Left aligned.
        .attr('x', xLegend / 2 + wLegend / 2).attr('y', yLegend - 6).attr('width', wLegend).style('text-anchor', 'middle')  // Centered.
        .text('Agent Count');
      const clrScale = d3.scaleSequential(interpolateRdYlBu).domain([0, ths.agentMaxCoveredCnt]);
      const clrBar = svgLegend.append('g').style('user-select', 'none')
        .attr('transform', 'translate(' + xLegend + ',' + yLegend + ')')
        .call(colorbarH(clrScale, wLegend, hLegend).tickValues([0, ths.agentMaxCoveredCnt / 2, ths.agentMaxCoveredCnt]));

      d3.select(self.frameElement).style('height', height + 'px');

      ths.updateChart1a(ths, ths.root);
    });
  }  /* End drawChart1a */

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
    const node = this.svg.selectAll('#d3chart1 g.c1a_node')
      .data(nodes, function (d: any) { return d.id; });

    // Enter any new nodes at the parent's previous position
    const nodeEnter = node.enter().append('g')
      .attr('class', 'c1a_node')
      .attr('transform', function (d) { return 'translate(' + source.y0 + ',' + source.x0 + ')'; });

    // Add Circle for the nodes
    nodeEnter.append('circle')
      .attr('class', 'c1a_circle')
      .attr('r', 1e-6)
      .on('mouseover', (d) => { mouseOver(ths, d); })
      .on('mouseout', (d) => { mouseOut(ths, d); })
      .on('click', (d) => { mouseClick(ths, d); });

    // Add label background outlines for the nodes (Places left or right depending on whether node has children or not)
    nodeEnter.append('text')
      .attr('class', 'c1a_text')
      .style('user-select', 'none')
      .attr('dy', '.35em')
      .attr('x', function (d) { return d.children || d._children ? -18 : 18; })
      .attr('text-anchor', function (d) { return d.children || d._children ? 'end' : 'start'; })
      .style('font-size', '14px')
      .style('stroke-width', ths.strokeHighlight)
      .style('stroke', '#fff')
      .text(function (d: any) {
        // const text = d.data.id.substring(0, 8);
        // return text.length < d.data.id.length ? text + '...' : text;
        if (d.depth === 0) { return ''; }
        const text = d.data.description.substring(0, 20);
        return text.length < d.data.description.length ? text + '...' : text;
      })
      .style('fill-opacity', 1e-6);

    // Add labels for the nodes (Places left or right depending on whether node has children or not)
    nodeEnter.append('text')
      .attr('class', 'c1a_text')
      .style('user-select', 'none')
      .attr('dy', '.35em')
      .attr('x', function (d) { return d.children || d._children ? -18 : 18; })
      .attr('text-anchor', function (d) { return d.children || d._children ? 'end' : 'start'; })
      .style('font-size', '14px')
      .text(function (d: any) {
        // const text = d.data.id.substring(0, 8);
        // return text.length < d.data.id.length ? text + '...' : text;
        if (d.depth === 0) { return ''; }
        const text = d.data.description.substring(0, 20);
        return text.length < d.data.description.length ? text + '...' : text;
      })
      .style('fill-opacity', 1e-6);

    const pxOffset = '0.3em';
    // if (ths.isIE) { pxOffset = '??'; }

    // Add children indicator background outline if node has children
    nodeEnter.append('text')
      .attr('class', 'c1a_text')
      .style('pointer-events', 'none')  // Don't eat mouseovers.
      .style('user-select', 'none')
      .attr('text-anchor', 'middle')
      // .attr('dominant-baseline', 'central')
      .attr('dy', function () { return pxOffset; })
      .style('font-weight', 'bold')
      .style('font-size', '20px')
      .style('stroke-width', '2.5')
      .style('stroke', '#fff')
      .text(function (d) { return d.children || d._children ? '+' : ''; });

    // Add children indicator if node has children
    nodeEnter.append('text')
      .attr('class', 'c1a_text')
      .style('pointer-events', 'none')  // Don't eat mouseovers.
      .style('user-select', 'none')
      .attr('text-anchor', 'middle')
      // .attr('dominant-baseline', 'central')
      .attr('dy', function () { return pxOffset; })
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
    const scale = d3.scaleLinear().domain([0, ths.agentMaxCoveredCnt]).range([0, 1]);
    nodeUpdate.select('.c1a_circle')
      .attr('r', 12)
      // .style('font', '12px sans-serif')
      .style('fill', function (d) {
        // if (d.depth === 0) { return '#fff';
        if (d.depth !== 1) {
          return '#fff';
        } else {
          let agents = null;
          if (d.depth === 1) {
            agents = d.data.agents;
          } else { if (d.depth === 2) { agents = d.parent.data.agents; } }
          const clr = interpolateRdYlBu(scale(agents ? agents.length : 0));
          return clr;
        }
      })
      .style('stroke', ths.clrServicesNodeOutline)
      .style('stroke-width', '3')
      // .attr('cursor', function (d) { return d.children || d._children ? 'pointer' : 'default' });
      .attr('cursor', 'pointer');

    // nodeUpdate.select('.c1a_text')
    nodeUpdate.selectAll('.c1a_text')  // Workaround.
      .style('fill-opacity', 1);

    // Transition exiting nodes to the parent's new position (Remove exiting nodes)
    const nodeExit = node.exit().transition()
      .duration(ths.durationMoveElement)
      .attr('transform', function (d) { return 'translate(' + source.y + ',' + source.x + ')'; })
      .remove();

    // On exit reduce the node circles size to effectively 0
    nodeExit.select('.c1a_circle')
      .attr('r', 1e-6);

    // On exit reduce the opacity of text labels to effectively hidden
    nodeUpdate.select('.c1a_text')
      .style('fill-opacity', 1e-6);

    // *** Links section ***

    // Update the links...
    const link = this.svg.selectAll('.c1a_link')  // 'path.link'
      .data(links, function (d: any) { return d.data.id; });

    // Enter any new links at the parent's previous position
    const linkEnter = link.enter().insert('path', 'g')
      .attr('class', 'c1a_link')
      .attr('stroke', 'black')
      .attr('stroke-width', '2px')
      .attr('shape-rendering', 'auto')
      .attr('fill', 'none')
      .attr('d', function (d) {
        const o = { x: source.x0, y: source.y0 };
        return ths.diagonal(o, o);
      });

    // *** Update ***
    const linkUpdate = linkEnter.merge(link);

    // Transition links back to parent element position
    linkUpdate.transition()
      .duration(ths.durationMoveElement)
      // .duration(3000)  // For debugging.
      .attr('d', function (d) { return ths.diagonal(d, d.parent) });

    // Transition exiting nodes to the parent's new position (remove any exiting links)
    const linkExit = link.exit().transition()
      .duration(ths.durationMoveElement)
      .attr('d', function (d) {
        const o = { x: source.x, y: source.y };
        return ths.diagonal(o, o);
      })
      .remove();

    // Stash the old positions for transition
    nodes.forEach(function (d) {
      d.x0 = d.x;
      d.y0 = d.y;
    });

    // If there's a selection, insure that it gets redrawn
    if (ths.isSelectionChart1a) {
      d3.selectAll('.c1a_circle')
        .style('stroke-width', function (o: any) {
          return ths.selectionDataChart1a.data.id === o.data.id ? ths.strokeServicesNodeSelected : ths.strokeServicesNodeOutline;
        })
        .style('stroke', function (o: any) {
          return ths.selectionDataChart1a.data.id === o.data.id ? ths.clrSelected : ths.clrServicesNodeOutline;
        });
    }

    // tslint:disable-next-line:no-shadowed-variable
    function mouseOver(ths, d: any) {
      if (!ths.isServicesChart) { return; }
      d3.selectAll('.c1a_circle')
        .style('stroke', function (o: any) {
          let stroke;
          if (ths.isSelectionChart1a) {
            if (d.data.id === o.data.id) {
              stroke = ths.clrHighlight;
            } else {
              stroke = ths.selectionDataChart1a.data.id === o.data.id ? ths.clrSelected : ths.clrServicesNodeOutline;
            }
          } else {
            stroke = d.data.id === o.data.id ? ths.clrHighlight : ths.clrServicesNodeOutline;
          }
          return stroke;
        });

      /* Chart interactivity: Highlight matching agents in Chart2 - Bubble Chart */
      let agents = null;
      if (d.depth === 1) {
        agents = d.data.agents;
      } else if (d.depth === 2) {
        agents = d.parent.data.agents;
      }
      if (agents) {
        d3.selectAll('.c2_circle')
          .style('stroke', function (o: any) {
            const match = ths.index(agents, o.data.address) >= 0;
            return match ? ths.clrHighlight : 'white';
          }).style('stroke-width', function (o: any) {
            const match = ths.index(agents, o.data.address) >= 0;
            return match ? ths.strokeHighlight : '1';
          });
      }
      /* End chart interactivity */

      // Show HTML Tooltip
      ths.divTooltip1a.html(buildNodeTooltipHTML(d, d.depth === 1));
      const evt = d3.event;
      const wTT = ths.divTooltip1a.node().clientWidth, hTT = ths.divTooltip1a.node().clientHeight;
      const xTT = evt.pageX < (window.innerWidth - wTT) - ths.marginTT ? evt.pageX + 12 : (evt.pageX + 12) - wTT;
      const yTT = evt.pageY < window.innerHeight - hTT ? evt.pageY - 12 : (evt.pageY - 12) - hTT;
      ths.divTooltip1a.style('opacity', ths.opacityTT)
        .style('left', xTT + 'px')
        .style('top', yTT + 'px');
    };

    // tslint:disable-next-line:no-shadowed-variable
    function mouseOut(ths, d: any) {
      ths.divTooltip1a.style('opacity', 0);

      d3.selectAll('.c1a_circle')
        .style('stroke', ths.clrServicesNodeOutline)
        .style('stroke-width', ths.strokeServicesNodeOutline);

      // If there's a selection, redraw selection
      if (ths.isSelectionChart1a) {
        d3.selectAll('.c1a_circle')
          .style('stroke-width', function (o: any) {
            return ths.selectionDataChart1a.data.id === o.data.id ? ths.strokeServicesNodeSelected : ths.strokeServicesNodeOutline;
          })
          .style('stroke', function (o: any) {
            return ths.selectionDataChart1a.data.id === o.data.id ? ths.clrSelected : ths.clrServicesNodeOutline;
          });
      }

      /* Chart interactivity: Revert highlighting in other chart */
      d3.selectAll('.c2_circle')
        .style('stroke', 'white')
        .style('stroke-width', '1');
      /* End chart interactivity */
    };

    // tslint:disable-next-line:no-shadowed-variable
    function mouseClick(ths, d: any) {
      if (!ths.isServicesChart) { return; }

      // Hide tooltip. Use transition to help avoid unintentional new tooltips if transitioning nodes slide under cursor
      ths.divTooltip1a.transition().duration(500).style('opacity', 0);

      // If leaf node, handle selection / deselection of the node
      if (d.depth === 2) {
        // Mark as selected if no current selection or if click on a different node to select it
        if (ths.isSelectionChart1a === false || ths.selectionDataChart1a !== d) {
          d3.selectAll('.c1a_circle')
            .style('stroke-width', function (o: any) {
              return d.data.id === o.data.id ? ths.strokeServicesNodeSelected : ths.strokeServicesNodeOutline;
            })
            .style('stroke', function (o: any) {
              return d.data.id === o.data.id ? ths.clrSelected : ths.clrServicesNodeOutline;
            });

          /* Chart interactivity: Show matching agents (only) in Chart2 - Bubble Chart */
          let agents = null;
          if (d.depth === 1) {
            agents = d.data.agents;
          } else { if (d.depth === 2) { agents = d.parent.data.agents; } }
          ths.selectionAgentsListChart1a = agents;
          if (ths.isSelectionChart1a === false || ths.selectionDataChart1a.parent.data.id !== d.parent.data.id) {
            ths.drawChart2(ths);
            // ths.isSelectionChart1a = true;
            // ths.selectionDataChart1a = d;
            // ths.updateChart2(ths);
          }
          /* End chart interactivity */

          ths.isSelectionChart1a = true;
          ths.selectionDataChart1a = d;
        } else {  // Revert selection
          d3.selectAll('.c1a_circle')
            .style('stroke', ths.clrServicesNodeOutline)
            .style('stroke-width', ths.strokeServicesNodeOutline);

          ths.isSelectionChart1a = false;
          ths.selectionDataChart1a = ths.selectionAgentListChart1a = null;

          /* Chart interactivity: Show all agents again in other chart */
          ths.drawChart2(ths);
          /* End chart interactivity */
        }

        return;
      }

      // Else is non-leaf node. If expanded, collapse it
      if (!ChartsComponent.isNodeCollapsed(d)) {
        ChartsComponent.collapseNode(d);

        // If there was a selection in Services chart, which is now hidden, cancel it
        if (ths.isSelectionChart1a && (ths.selectionDataChart1a.parent.data.id === d.data.id || d.depth === 0)) {
          ths.isSelectionChart1a = false;
          ths.selectionDataChart1a = ths.selectionAgentListChart1a = null;
          ths.drawChart2(ths);
        }
      } else {
        ChartsComponent.expandNode(d);
      }
      ths.updateChart1a(ths, d);

      // If there's a selection, insure that it gets redrawn
      if (ths.isSelectionChart1a) {
        d3.selectAll('.c1a_circle')
          .style('stroke-width', function (o: any) {
            return ths.selectionDataChart1a.data.id === o.data.id ? ths.strokeServicesNodeSelected : ths.strokeServicesNodeOutline;
          })
          .style('stroke', function (o: any) {
            return ths.selectionDataChart1a.data.id === o.data.id ? ths.clrSelected : ths.clrServicesNodeOutline;
          });
      }
    }

    function buildNodeTooltipHTML(d, verbose) {
      const headText = (d.data.id === null || d.data.id === '') ? d.data.description : d.data.description + '<hr>'
        + 'Service ID ' + d.data.id;

      if (verbose) {
        const agentCount = d.data.agents ? d.data.agents.length : 0;
        const serviceCount = d.data.services ? d.data.services.length : 0;
        const colorsIcon = './../../../assets/images/colors.png';

        return '<div class=\'node-detailed-tooltip\'> <table class=\'table\'> <thead> <tr> <th colspan=\'2\'>' + headText +
          '</th> </tr> </thead> <tbody> <tr> <td class=\'collapsing\'>'
          + '<img src=\'' + colorsIcon + '\'' + 'width=\'28px\' height=\'auto\' style=\'padding-right:4px; margin-top:-2px\'/>'
          + '<span>Agent Count</span> </td> <td>' + agentCount +
          '</td> </tr> <tr> <td> <span>Service Count</span> </td> <td>' + serviceCount +
          // '</td> </tr> <tr> <td> <span>TODO</span> </td> <td>' + d.data.TODO +
          '</td> </tr> </tbody> </table> </div>';
      } else {
        return '<div class=\'node-tooltip\'> <table class=\'table\'> <tbody> <tr>'
          + '<td nowrap style=\'border-top: none\'> <b>' + headText + '</b> </td> </tr> </tbody> </table> </div>';
      }
    }
  }  /* End of updateChart1a() */

  /*
   * ## Chart 1b: Agents Activity Stacked Bar Chart ##
   */

  /*
   * initChart1b()
   */
  private initChart1b(ths) {
    ths.isInitialLoadChart1b = false;

    // Define div for tooltip
    if (ths.divTooltip1b === null) {
      ths.divTooltip1b = d3.select('body')
        .append('div')
        .attr('class', 'd3tooltip')
        .style('opacity', 0);
    }
  }

  /*
   * drawChart1b()
   */
  private drawChart1b(ths) {
    const marginFactor = 0.93;
    const width = document.getElementById('d3chart1_card_block').clientWidth * marginFactor;
    const height = document.getElementById('d3chart1_card_block').clientHeight * marginFactor;
    // console.log('drawChart1b: w=' + width + ', h=' + height);

    let barRects = null;

    ths.isShowBtnsChart1a = false;
    // ths.isShowBtnsChart1b = (width > ths.minWidthShowBtns) ? true : false;

    const fileJSON = './../../../assets/activity.executed.json';

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
      keys.sort();  // Sort agents (stack from bottom to top of each bar on chart).
      // console.log('Activity Stacked Bar Chart: Agent Count=' + keys.length);

      // Construct chart series with data and keys
      const series = d3.stack()
        .keys(keys)
        (data);

      // Clear out everything from the SVG element for this chart
      d3.select('#d3chart1').selectAll('*').remove();
      d3.select('#d3chart1_legend').selectAll('*').remove();

      // Set SVG client area size and position
      ths.svg = d3.select('#d3chart1')
        .attr('width', width)
        .attr('height', height)
        .attr('class', 'stack')
        .attr('transform', 'translate(' + ths.svgMargin.left + ',' + ths.svgMargin.top + ')')

      // const margin = this.svgMargin;
      const margin = { top: 10, right: 30, bottom: 45, left: 50 };

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
      // .nice();

      // Configure Z scale (colors)
      const z = d3.scaleOrdinal(d3.schemeCategory20c);
      //      const z = d3.scaleLinear().domain([0, ths.serviceMaxPendCnt]).range([0, 1]);

      // Bars
      barRects = ths.svg.append('g')
        .selectAll('g')
        .data(series)
        .enter().append('g')
        .attr('fill', function (d) { return z(d.key); })
        // .attr('fill', function (d) {
        //   const idx = ths.indexByField(ths.arrAgents, 'address', d.key);
        //   const rating = ths.arrAgents[idx].rating.average;
        //   const pendingCnt = ths.arrAgents[idx].pendContractsCnt;
        //   // return interpolateRdYlBu(rating);
        //   return interpolateRdYlBu(z(pendingCnt));
        // })
        .selectAll('rect')
        .data(function (d) { return d; })
        .enter().append('rect')
        .attr('class', 'c1b_rect')
        .attr('width', x.bandwidth)
        .attr('x', function (d: any) { return x(d.data.date); })
        .attr('y', function (d) { return y(d[0]); })  // Start bar segment at bottom. Will transition to top.
        .attr('height', 0)  // Start at 0 height. Will transition to actual height.
        .on('mouseover', function (d: any) {
          const pDatum: any = d3.select(this.parentNode).datum();
          mouseOver(ths, d, pDatum);
        })
        .on('mouseout', (d) => { mouseOut(ths, d); });
      // .on('click', function (d: any) {
      //   const pDatum: any = d3.select(this.parentNode).datum();
      //   mouseClick(ths, d, pDatum);
      // });

      // Bar selection rects
      ths.svg.append('g')
        .selectAll('g')
        .data(series)
        .enter().append('g')
        .attr('fill', function (d) { return z(d.key); })
        // .attr('fill', function (d) {
        //   const idx = ths.indexByField(ths.arrAgents, 'address', d.key);
        //   const rating = ths.arrAgents[idx].rating.average;
        //   const pendingCnt = ths.arrAgents[idx].pendContractsCnt;
        //   // return interpolateRdYlBu(rating);
        //   return interpolateRdYlBu(z(pendingCnt));
        // })
        .selectAll('rect')
        .data(function (d) { return d; })
        .enter().append('rect')
        .attr('class', function (d) {
          // Include agent id as secondary classname to enable interchart joins
          const pDatum: any = d3.select(this.parentNode).datum();
          const classnames = 'c1b_selectionrect' + ' A' + pDatum.key;  // Classnames can't start with a digit.
          return classnames;
        })
        .style('pointer-events', 'none')  // Don't eat mouseovers.
        .attr('width', x.bandwidth)
        .attr('x', function (d: any) { return x(d.data.date); })
        .attr('y', function (d) { return y(d[1]); })
        .attr('height', function (d) { return y(d[0]) - y(d[1]); })
        .style('opacity', 0)
        .style('stroke', ths.clrHighlight)
        .style('stroke-width', ths.strokeHighlight);

      // X Axis
      ths.svg.append('g')
        .attr('transform', 'translate(0,' + y(0) + ')')
        .call(d3.axisBottom(x))
        .selectAll('text')
        .attr('y', 6)
        .attr('x', 7)
        .attr('dy', '.35em')
        .attr('transform', 'rotate(45)')
        .style('user-select', 'none')
        .style('text-anchor', 'start');

      // Y Axis
      ths.svg.append('g')
        .attr('transform', 'translate(' + margin.left + ',0)')
        .style('user-select', 'none')
        .call(d3.axisLeft(y));

      // Y Axis label
      ths.svg.append('text')
        .attr('transform', 'rotate(-90)')
        // .attr('y', 0 - margin.left)
        .attr('y', 0)
        .attr('x', 0 - (height / 2))
        .attr('dy', '1em')
        .style('text-anchor', 'middle')
        .style('user-select', 'none')
        .style('font-size', '14px')
        .text('Contracts');

      // Bar segment transition to make bar sections appear, ending with the correct height
      barRects.transition()
        // .delay(50)
        .duration(ths.durationFadeActivityChart)
        .attr('height', function (d: any) { return y(d[0]) - y(d[1]); })
        .attr('y', function (d) { return y(d[1]); });

      // Legend
      const label = ths.isActivityChartPendingMode ? 'Pending Contracts' : 'Executed Contracts';
      const xLegend = 10, yLegend = 30, wLegend = 150, hLegend = 20;
      const svgLegend = d3.select('#d3chart1_legend');
      svgLegend.append('text').attr('x', xLegend).attr('y', yLegend - 6).text(label)
        .style('user-select', 'none');
      svgLegend.append('text').attr('x', xLegend + 35).attr('y', yLegend + 12).text('by Agent')
        .style('user-select', 'none');
      /*
      const xLegend = 8, yLegend = 20, wLegend = 145, hLegend = 20;
      const svgLegend = d3.select('#d3chart1_legend');
      svgLegend.append('text').style('user-select', 'none')
      // .attr('x', xLegend).attr('y', yLegend - 6)  // Left aligned.
      .attr('x', xLegend / 2 + wLegend / 2).attr('y', yLegend - 6).attr('width', wLegend).style('text-anchor', 'middle')  // Centered.
      .text('Pending Contracts');
      const clrScale = d3.scaleSequential(interpolateRdYlBu).domain([0, ths.serviceMaxPendCnt]);
      const clrBar = svgLegend.append('g').style('user-select', 'none')
        .attr('transform', 'translate(' + xLegend + ',' + yLegend + ')')
        .call(colorbarH(clrScale, wLegend, hLegend).tickValues([0, ths.serviceMaxPendCnt / 2, ths.serviceMaxPendCnt]));
      */

      d3.select(self.frameElement).style('height', height + 'px');
    });

    function stackMin(serie) {
      return d3.min(serie, function (d) { return d[0]; });
    }

    function stackMax(serie) {
      return d3.max(serie, function (d) { return d[1]; });
    }

    // tslint:disable-next-line:no-shadowed-variable
    function mouseOver(ths, d: any, pDatum) {
      if (ths.isServicesChart) { return; }
      const agent = pDatum.key;
      // d3.selectAll('.c1b_selectionrect')
      //   .style('opacity', function (o: any) {
      //     return d.data.date === o.data.date && d[1] === o[1] ? 1 : 0;
      //   });
      const agentClass = '.A' + agent;
      d3.selectAll(agentClass).style('stroke', ths.clrHighlight).style('opacity', 1);

      /* Chart interactivity: Highlight matching agents in Chart2 - Bubble Chart */
      d3.selectAll('.c2_circle')
        .style('stroke', function (o: any) {
          return agent === o.data.address ? ths.clrHighlight : 'white';
        }).style('stroke-width', function (o: any) {
          return agent === o.data.address ? ths.strokeHighlight : '1';
        });
      /* End chart interactivity */

      // Show HTML Tooltip
      ths.divTooltip1b.html(buildNodeTooltipHTML(d, pDatum, true));
      const evt = d3.event;
      const wTT = ths.divTooltip1b.node().clientWidth, hTT = ths.divTooltip1b.node().clientHeight;
      const xTT = evt.pageX < (window.innerWidth - wTT) - ths.marginTT ? evt.pageX + 12 : (evt.pageX + 12) - wTT;
      const yTT = evt.pageY < window.innerHeight - hTT ? evt.pageY - 12 : (evt.pageY - 12) - hTT;
      ths.divTooltip1b.style('opacity', ths.opacityTT)
        .style('left', xTT + 'px')
        .style('top', yTT + 'px');
    };

    // tslint:disable-next-line:no-shadowed-variable
    function mouseOut(ths, d: any) {
      d3.selectAll('.c1b_selectionrect')
        .style('opacity', 0);
      ths.divTooltip1b.style('opacity', 0);

      /* Chart interactivity: Revert highlighting in other chart */
      d3.selectAll('.c2_circle')
        .style('stroke', 'white')
        .style('stroke-width', '1');
      /* End chart interactivity */
    };

    // tslint:disable-next-line:no-shadowed-variable
    /*
    function mouseClick(ths, d: any, pDatum) {
      if (ths.isServicesChart) { return; }
      ths.divTooltip1b.style('opacity', 0);

      const agent = pDatum.key;
      const agentClass = '.A' + agent;
      d3.selectAll(agentClass).style('stroke', ths.clrSelected).style('opacity', 1);
    }
    */

    function buildNodeTooltipHTML(d, datum, verbose) {
      const agent = datum.key;
      const value = d.data[agent];
      const idx = ths.indexByField(ths.arrAgents, 'address', agent);
      const pendingCnt = ths.arrAgents[idx].pendContractsCnt;
      const sizeByIcon = './../../../assets/images/sizes-rect.png';
      const colorsIcon = './../../../assets/images/colors.png';

      return '<div class=\'node-tooltip\'> <table class=\'table\'> <thead> <tr> <th colspan=\'2\'>'
        + '<b>Agent ' + agent + '</b> </th> </tr> </thead> <tbody> <tr> <td class=\'collapsing\'>' + '<img src=\''
        + sizeByIcon + '\'' + 'width=\'28px\' height=\'auto\' style=\'padding-left:6px; padding-right:8px; margin-top:-2px\'/>'
        + '<span>Executed Contracts</span> </td> <td>' + value + '</td> </tr> <tr> <td>'
        + '<img src=\'' + colorsIcon + '\'' + 'width=\'28px\' height=\'auto\' style=\'padding-right:4px; margin-top:-2px\'/>'
        + '<span>Pending Contracts</span> </td> <td>' + pendingCnt +
        // '</td> </tr> <tr> <td> <span>TODO</span> </td> <td>' + d.data.TODO +
        '</td> </tr> </tbody> </table> </div>';
    }
  }  /* End drawChart1b() */

  /*
   * ## Chart2: Agents Bubble Chart ##
   */

  /*
   * initChart2()
   */
  private initChart2(ths) {
    ths.isInitialLoadChart2 = false;

    // Define div for tooltip
    if (ths.divTooltip2 === null) {
      ths.divTooltip2 = d3.select('body')
        .append('div')
        .attr('class', 'd3tooltip')
        .style('opacity', 0);
    }
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

    ths.isShowBtnsChart2 = (width > ths.minWidthShowBtns) ? true : false;

    const fileJSON = './../../../assets/agents.json';

    // Pack bubbles
    let root, treeData: any;
    ths.bubble = d3.pack()
      // TODO: breaks overall bubble pack layout resizing
      // .radius(function (d: any) {
      //   const minValue = 50;  // Min bubble size.
      //   return (d.value < minValue) ? Math.sqrt(minValue) : Math.sqrt(d.value);
      // })
      .size([diameter * marginFactor, diameter * marginFactor])
      .padding(2);

    // Get the data and build the elements
    d3.json(fileJSON, function (error, data: any) {
      if (error) { throw error; }
      // console.log('Agents Bubble Chart: Agent Count=' + data.length);

      ths.dataChart2 = data;

      // Extract and save array of Agents from data
      for (let i = 0; i < data.length; i++) {
        const obj = data[i]
        const agent = {
          address: obj.address, description: obj.description, wealth: obj.wealth, rating: obj.rating,
          pendContractsCnt: obj.pendingContracts.length
        };
        ths.arrAgents.push(agent);
        // console.log('push(' + agent.address + ')');
      }
      ths.arrAgents.sort();

      // Add root node for d3.hierarchy
      const data_selected = [];
      if (ths.isSelectionChart1a === false) {
        treeData = { id: '', description: 'Agents', agents: data };
      } else {
        // Build subtree of selected agents only
        for (let i = 0; i < ths.selectionAgentsListChart1a.length; i++) {
          const agent = ths.selectionAgentsListChart1a[i];
          const idx = ths.indexByField(data, 'address', agent);
          // console.log(agent + ', ' + idx);
          if (idx !== -1) { data_selected.push(data[idx]); }
        }
        treeData = { id: '', description: 'Agents', agents: data_selected };
        // console.log(data_selected);
      }

      // Parse data into d3 hierarchy
      root = d3.hierarchy(ths.classesChart2(treeData))
        .sum(function (d: any) { return d.value; })
        .sort(function (a, b) { return b.value - a.value; });
      ths.bubble(root);

      // Clear out everything from the SVG element for this chart
      d3.select('#d3chart2').selectAll('*').remove();
      d3.select('#d3chart2_legend').selectAll('*').remove();

      // Set SVG client area size and position
      const x = (width - diameter) / 2, y = (height - diameter) / 2;
      const svg = d3.select('#d3chart2')
        .attr('width', diameter)
        .attr('transform', 'translate(' + x + ',' + y + ')')
        // .attr('height', diameter)
        .attr('class', 'bubble');

      nodes = svg.selectAll('.c2_node')
        .data(root.children)
        .enter().append('g')
        .attr('class', 'c2_node')
        .attr('transform', function (d: any) { return 'translate(' + d.x + ',' + d.y + ')'; });

      circles = nodes.append('circle')
        .attr('class', 'c2_circle')
        .attr('r', 0)  // Start at 0 radius. Will transition to actual radius.
        .style('fill', function (d: any) {
          return interpolateRdYlBu(d.data.rating_avg);
        })
        .on('mouseover', (d) => { mouseOver(ths, d); })
        .on('mouseout', (d) => { mouseOut(ths, d); })

      labels = nodes.append('text')
        .style('font-family', ths.font)
        .style('font-size', (ths.isSelectionChart1a ? ths.fontsize * 1.75 : ths.fontsize) + 'px')
        .style('font-weight', 'bold')
        .attr('dy', '.3em')
        .style('text-anchor', 'middle')
        .style('pointer-events', 'none')
        .style('user-select', 'none')
        .style('opacity', '0')  // Start hidden. Will transition to visible.
        .text(function (d: any) {
          if (d.r < 14) { return ''; }
          // const id = d.data.address.substring(0, d.r / 5);
          const id = d.data.address.substring(0, d.r / (ths.isSelectionChart1a ? 9 : 5));
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

      // Legend
      const xLegend = 8, yLegend = 20, wLegend = 145, hLegend = 20;
      const svgLegend = d3.select('#d3chart2_legend');
      svgLegend.append('text').style('user-select', 'none')
        // .attr('x', xLegend).attr('y', yLegend - 6)  // Left aligned.
        .attr('x', xLegend / 2 + wLegend / 2).attr('y', yLegend - 6).attr('width', wLegend).style('text-anchor', 'middle')  // Centered.
        .text('Agent Rating');
      const clrScale = d3.scaleSequential(interpolateRdYlBu).domain([0, 1]);
      const clrBar = svgLegend.append('g')
        .style('user-select', 'none')
        .attr('transform', 'translate(' + xLegend + ',' + yLegend + ')')
        .call(colorbarH(clrScale, wLegend, hLegend).tickValues([0, 0.5, 1]));

      d3.select(self.frameElement).style('height', diameter + 'px');
    });

    // tslint:disable-next-line:no-shadowed-variable
    function mouseOver(ths, d: any) {
      d3.selectAll('.c2_circle')
        .style('stroke', function (o: any) {
          return d.data.address === o.data.address ? ths.clrHighlight : 'white';
        }).style('stroke-width', function (o: any) {
          return d.data.address === o.data.address ? ths.strokeHighlight : '1';
        });

      /* Chart interactivity: Highlight matching agents... */
      const agent = d.data.address;
      if (ths.isServicesChart) {
        // ...in Chart1a - Services Ontology Tree Chart
        d3.selectAll('.c1a_circle')
          .style('stroke', function (o: any) {
            const match = o.data.agents ? ths.index(o.data.agents, agent) >= 0 : ths.index(o.parent.data.agents, agent) >= 0;
            return match ? ths.clrHighlight : ths.clrServicesNodeOutline;
          }).style('stroke-width', function (o: any) {
            if (ths.isSelectionChart1a && ths.selectionDataChart1a.data.id === o.data.id) {
              return ths.strokeServicesNodeSelected;
            } else {
              const match = o.data.agents ? ths.index(o.data.agents, agent) >= 0 : ths.index(o.parent.data.agents, agent) >= 0;
              return match ? ths.strokeServiceHighlight : ths.strokeServicesNodeOutline;
            }
          });
      } else {
        // ...in Chart1b - Activities Stacked Bar Chart
        const agentClass = '.A' + agent;
        d3.selectAll(agentClass).style('stroke', ths.clrHighlight).style('opacity', 1);
      }
      /* End chart interactivity */

      // Show HTML Tooltip
      ths.divTooltip2.html(buildNodeTooltipHTML(d, true));
      const evt = d3.event;
      const wTT = ths.divTooltip2.node().clientWidth, hTT = ths.divTooltip2.node().clientHeight;
      const xTT = evt.pageX < (window.innerWidth - wTT) - ths.marginTT ? evt.pageX + 12 : (evt.pageX - 12) - wTT;
      const yTT = evt.pageY < window.innerHeight - hTT ? evt.pageY - 12 : (evt.pageY + 12) - hTT;
      ths.divTooltip2.style('opacity', ths.opacityTT)
        .style('left', xTT + 'px')
        .style('top', yTT + 'px');
    };

    // tslint:disable-next-line:no-shadowed-variable
    function mouseOut(ths, d: any) {
      d3.selectAll('.c2_circle')
        .style('stroke', 'white')
        .style('stroke-width', '1');
      ths.divTooltip2.style('opacity', 0);

      /* Chart interactivity: Revert highlighting in other chart */
      if (ths.isServicesChart) {
        d3.selectAll('.c1a_circle')
          .style('stroke', function (o: any) {
            if (ths.isSelectionChart1a && ths.selectionDataChart1a.data.id === o.data.id) {
              return ths.clrSelected;
            } else {
              return ths.clrServicesNodeOutline;
            }
          })
          .style('stroke-width', function (o: any) {
            if (ths.isSelectionChart1a && ths.selectionDataChart1a.data.id === o.data.id) {
              return ths.strokeServicesNodeSelected;
            } else {
              return '3';
            }
          });
      } else {
        d3.selectAll('.c1b_selectionrect').style('stroke', ths.clrHighlight).style('opacity', 0);
      }
      /* End chart interactivity */
    };

    function buildNodeTooltipHTML(d, verbose) {
      const headText = (d.data.description === '') ? 'Agent ' + d.data.address : d.data.description + '<hr>'
        + 'Agent ' + d.data.address;

      if (verbose) {
        const wealthFormat = d3.format(',.2f');
        const wealthText = wealthFormat(d.data.wealth) + ' AGI';
        // const pendContracts = d.data.pend_contracts ? d.data.pend_contracts.length : 0;
        // const execContracts = d.data.exec_contracts ? d.data.exec_contracts.length : 0;
        const sizeByIcon = './../../../assets/images/sizes-circ.png';
        const colorsIcon = './../../../assets/images/colors.png';

        return '<div class=\'node-detailed-tooltip\'> <table class=\'table\'> <thead> <tr> <th colspan=\'2\'>' +
          headText + '</th> </tr> </thead> <tbody> <td class=\'collapsing\'>' + '<img src=\'' + sizeByIcon + '\''
          + 'width=\'36px\' height=\'auto\' style=\'padding-right:3px; margin-left:-10px; margin-top:-7px\'/>'
          + '<span>Wealth</span> </td> <td>' + wealthText + '</td> </tr> <tr> <td>'
          + '<img src=\'' + colorsIcon + '\'' + 'width=\'28px\' height=\'auto\' style=\'padding-right:4px; margin-top:-2px\'/>'
          + '<span>Agent Rating (average)</span> </td> <td>' + d.data.rating_avg
          + '</td> </tr> <tr> <td> <span>Agent Rating Count</span> </td> <td>' + d.data.rating_cnt
          // + '</td> </tr> <tr> <td> <span>Pending Contract Count</span> </td> <td>' + pendContracts
          // + '</td> </tr> <tr> <td> <span>Executed Contract Count</span> </td> <td>' + execContracts
          // + '</td> </tr> <tr> <td> <span>TODO</span> </td> <td>' + d.data.TODO +
          + '</td> </tr> </tbody> </table> </div>';
      } else {
        return '<div class=\'node-tooltip\'> <table class=\'table\'> <tbody> <tr> <td nowrap>' + headText +
          '</td> </tr> </tbody> </table> </div>';
      }
    }
  }  /* End drawChart2() */

  /*
   * TODO: updateChart2()
   */
  private updateChart2(ths) {
    // console.log('updateChart2()');
    let nodes = null, circles = null, labels = null;
    let root, treeData: any;
    const data_selected = [], data = ths.dataChart2;
    const duration = 2000;

    if (ths.isSelectionChart1a === false) {
      treeData = { id: '', description: 'Agents', agents: data };
    } else {
      // Build subtree of selected agents only
      for (let i = 0; i < ths.selectionAgentsListChart1a.length; i++) {
        const agent = ths.selectionAgentsListChart1a[i];
        const idx = ths.indexByField(data, 'address', agent);
        // console.log(agent + ', ' + idx);
        if (idx !== -1) { data_selected.push(data[idx]); }
      }
      treeData = { id: '', description: 'Agents', agents: data_selected };
      // console.log('updateChart2(): selection=' + data_selected);
    }

    // Parse data into d3 hierarchy
    root = d3.hierarchy(ths.classesChart2(treeData))
      .sum(function (d: any) { return d.value; })
      .sort(function (a, b) { return b.value - a.value; });
    ths.bubble(root);

    const svg = d3.select('#d3chart2');

    // JOIN
    // nodes = svg.selectAll('c2_node')
    nodes = svg.selectAll('g.c2_node')
      .data(root.children, function (d: any) { return d.data.address; })
    circles = nodes.selectAll('.c2_circle');
    labels = nodes.selectAll('text');

    // EXIT
    nodes.exit().remove();
    circles.exit().remove();
    labels.exit().remove();

    // UPDATE
    nodes
      .transition().duration(duration)
      .attr('transform', function (d: any) { return 'translate(' + d.x + ',' + d.y + ')'; });

    circles
      .transition().duration(duration)
      .attr('r', function (d) { return d.r * 2 });

    labels
      .transition().duration(duration)
      .style('font-size', (ths.fontsize * 1.75) + 'px');

    // ENTER
    nodes
      .enter().append('g')
      .attr('class', 'c2_node')
      .transition().duration(duration)
      .attr('transform', function (d: any) { return 'translate(' + d.x + ',' + d.y + ')'; });  // TODO: Not working.

    circles = nodes.enter().append('circle')
      .attr('class', 'c2_circle')
      .transition().duration(duration)
      .attr('r', function (d) { return d.r })
      .style('fill', function (d: any) {
        return interpolateRdYlBu(d.data.rating_avg);
      });

    labels = nodes.append('text')
      .style('font-family', ths.font)
      .style('font-size', (ths.fontsize) + 'px')
      .style('font-weight', 'bold')
      .attr('dy', '.3em')
      .style('text-anchor', 'middle')
      .style('pointer-events', 'none')
      .style('user-select', 'none')
      .style('opacity', '0')  // Start hidden. Will transition to visible.
      .text(function (d: any) {
        if (d.r < 14) { return ''; }
        const id = d.data.address.substring(0, d.r / 5);
        return id.length < d.data.address.length ? id + '...' : id;
      });
  }  /* End updateChart2() */

  // Returns a flattened hierarchy containing all leaf nodes under the root.
  private classesChart2(root) {
    const classes = [];
    recurse(null, root);
    return { children: classes };

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
  }
}
