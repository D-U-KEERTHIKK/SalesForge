module.exports = function() {
  const DataCardsView = require('../DataCards/datacards.view')();

  return Backbone.View.extend({
    className: 'line-graph-div',
    tagName: 'div',
    template: _.template(require('./linegraph.template.html')),
    initialize: function(options) {
      this.params = options.params;
      this.cardInfo = options.cardInfo;
      this.legendInfo = options.legendInfo;
      this.graphLines = options.graphLines;

      this.render();
    },

    render: function() {
      const content = this.template({});
      this.$el.html(content);

      this.setCardAndLegendInfo(this.cardInfo, this.legendInfo);
      this.setGraphLines(this.graphLines);
      this.initGraph();

      return this;
    },

    events: {
      'mousemove': 'lineGraphMouseMove',
      'mouseleave': 'lineGraphMouseLeave',
      'click': 'lineGraphMouseClick'
    },

    // SETTERS

    setCardAndLegendInfo: function(cardInfo, legendInfo) {
      let params = {
        cardInfo,
        legendInfo
      };
      this.dataCards = new DataCardsView(params);
      this.$el.find('.line-graph-info-container').html(this.dataCards.$el);
    },

    updateCardInfo: function(cardInfo) {
      this.dataCards.model.set('cardInfo', cardInfo);
      this.dataCards.model.trigger('change:model');
    },

    setGraphLines: function(graphLines) {
      this.graphLines = graphLines;
    },

    createAndSetGraphLine: function(startDate, endDate, licensedUsersCount, lineValues, selectedPointLine) {
      const licensedUsers = [
        { date: new Date(startDate), count: licensedUsersCount },
        { date: new Date(endDate), count: licensedUsersCount }
      ];

      // draw two similar lines if there is no selected point
      if (selectedPointLine.length === 0) {
        selectedPointLine = licensedUsers;
      }

      const graphLines = {
        userCountLine: {
          class: 'primary-line',
          data: lineValues,
          displayPoint: '<rect class="point" x="-2.5" y="-2.5" width="5" height="5"/>',
          displayHover: '<circle cx="0" cy="0" r="10"/><text x="0" y="0" text-anchor="middle" alignment-baseline="mathematical"></text>',
          hover_radius: 20,
          onHover: function(dataPoint, hoverObj) {
            hoverObj.childNodes[1].innerHTML = dataPoint.count;
          }.bind(this),
          click_radius: 20,
          onClick: function(dataPoint) {
            this.trigger('dataPoint:selected', dataPoint);
          }.bind(this),
          z_index: 2
        },
        selection: {
          class: 'point-selection',
          displayPoint: function(dimensions, lineId, dataPoint) {
            return '<line x1="0" y1="0" x2="0" y2="' + dimensions.graphHeight + '"/><circle cx="0" cy="0" r="10" class="outer-circle"/><circle cx="0" cy="0" r="9" class="inner-circle"/><text x="0" y="0" text-anchor="middle" alignment-baseline="mathematical">' + dataPoint.count + '</text>';
          },
          data: selectedPointLine,
          z_index: 3
        }
      };

      // set graph line
      this.setGraphLines(graphLines);
    },

    updateGraph: function() {
      if (!_.isEmpty(this.graphLines)) {
        this.drawLines(this.graphLines);
      }
    },

    initGraph: function() {
      this.params.tick_format_x = this.params.tick_format_x || function(i) { return i; };
      this.params.tick_format_y = this.params.tick_format_y || function(i) { return i; };

      this.gridSize = {
        width: this.params.width - this.params.margin_left - this.params.margin_right,
        height: this.params.height - this.params.margin_top - this.params.margin_bottom
      };
      this.lines = {};
      this.curLineId = 0;

      // Draw axes
      const graphDiv = d3.select(this.el);

      graphDiv.style('width', this.params.width + 'px')
          .style('height', this.params.height + 'px');
 
      const graphSvg = graphDiv.append("svg")
          .classed('line-graph', true)
          .attr('width', this.params.width + 'px')
          .attr('height', this.params.height + 'px');

      graphSvg.append('clipPath').attr('id', 'gridClip')
          .append('rect').attr('x', 0).attr('y', -5)
          .attr('width', this.gridSize.width).attr('height', this.gridSize.height + 7);

      this.graphGroup = graphSvg.append('g')
          .attr('width', this.params.width - this.params.margin_left)
          .attr('height', this.params.height - this.params.margin_top)
          .attr('transform', 'translate(' + this.params.margin_left + ',' + this.params.margin_top + ')');

      this.xAxis = d3.scaleTime().range([0, this.gridSize.width]);
      this.yAxis = d3.scaleLinear().range([this.gridSize.height, 0]);
      this.graphGroup.append('g')
          .classed('x-axis', true)
          .attr('transform', 'translate(0,' + this.gridSize.height + ')')
          .call(d3.axisBottom(this.xAxis).tickFormat(this.params.tick_format_x).tickSizeInner(15).tickSizeOuter(0));

      this.graphGroup.append('g')
          .classed('y-axis', true)
          .call(d3.axisLeft(this.yAxis).tickFormat(this.params.tick_format_y).tickSizeInner(-this.gridSize.width).tickSizeOuter(0));

      this.graphGroup.append('g')
          .classed('lines', true);     

      this.startMouseEvents();
    },

    getTransitionDuration: function() {
      return this.params.transition_time;
    },

    setTransitionDuration: function(duration) {
      this.params.transition_time = duration;
    },

    lineGraphMouseLeave: function() {
      this.graphGroup.selectAll('.line-group .hover').style('visibility', 'hidden');
    },

    lineGraphMouseMove: function(event) {
      if (!this.mouseEnabled) {
        return;
      }

      const mouseX = event.offsetX - this.params.margin_left;
      const mouseY = event.offsetY - this.params.margin_top;

      const closestPointInfo = this.chooseClosestPoint(
        { 
          x: mouseX, 
          y: mouseY 
        },
        'hover');

      if (closestPointInfo) {
        const chosenLineParams = closestPointInfo.lineParams;
        const chosenPoint = closestPointInfo.point;
        const chosenPointLoc = closestPointInfo.pointLoc;
        // set hover location
        const hoverObj = this.graphGroup.select('g.line-' + chosenLineParams.svgId + ' .hover');
        hoverObj.attr('transform', 'translate(' + chosenPointLoc.__x + ', ' + chosenPointLoc.__y + ')');

        d3.selectAll('.line-group .hover').each(
            function() {
              if (this == hoverObj.node()) {
                d3.select(this).style('visibility', '');
                this.parentNode.appendChild(this);
              } else {
                d3.select(this).style('visibility', 'hidden');
              }
            }
        );

        // do callback
        if (chosenLineParams.onHover) {
          chosenLineParams.onHover(chosenPoint, hoverObj.node());
        }
      } else {
        d3.selectAll('.line-group .hover').style('visibility', 'hidden');
      }
    },

    lineGraphMouseClick: function(event) {
      if (!this.mouseEnabled) {
        return;
      }

      const mouseX = event.offsetX - this.params.margin_left;
      const mouseY = event.offsetY - this.params.margin_top;

      const closestPointInfo = this.chooseClosestPoint(
        { x: (event.offsetX - this.params.margin_left), 
          y: (event.offsetY - this.params.margin_top) },
        'click');

      if (closestPointInfo) {
        const chosenLineParams = closestPointInfo.lineParams;
        const chosenPoint = closestPointInfo.point;
        const chosenPointLoc = closestPointInfo.pointLoc;

        // do callback
        if (chosenLineParams.onClick) {
          chosenLineParams.onClick(chosenPoint);
        }
      }
    },

    startMouseEvents: function() {
      this.mouseEnabled = true;
    },

    stopMouseEvents: function() {
      this.mouseEnabled = false;
      this.lineGraphMouseLeave();
    },

    drawLines: function(updatedLines) {
      updatedLines = Object.assign({}, updatedLines); // make shallow copy
      Object.keys(updatedLines).forEach(function(lineId) {
        updatedLines[lineId].id = lineId;

        if (typeof updatedLines[lineId].displayPoint == 'string') {
          updatedLines[lineId].displayPoint = function() { return this }.bind(updatedLines[lineId].displayPoint);
        }
        if (typeof updatedLines[lineId].displayHover == 'string') {
          updatedLines[lineId].displayHover = function() { return this; }.bind(updatedLines[lineId].displayHover);
        }

        if (lineId in this.lines) {
          const updatedData = updatedLines[lineId].data;
          // we want to keep the display settings, and only update the data
          updatedLines[lineId] = Object.assign({}, this.lines[lineId], { 'data': updatedData });
        }
      }.bind(this));
      const oldLineData = this.lines;
      this.lines = updatedLines;

      this.scaleAxes();

      const graphLines = this.graphGroup.select('.lines').selectAll('g.line-group').data(Object.keys(this.lines), function(i) { return i; });
      this.animateAddLines(graphLines);
      this.animateRemoveLines(graphLines, oldLineData);

      const lineIds = Object.keys(this.lines);
      lineIds.map(function(lineId) {
        this.animateUpdateLine(this.lines[lineId], false);
      }.bind(this));

      lineIds.sort(function(lineAId, lineBId) {
        let aZIndex = this.lines[lineAId].z_index;
        let bZIndex = this.lines[lineBId].z_index;
        if (!aZIndex) {
          aZIndex = 0;
        }
        if (!bZIndex) {
          bZIndex = 0;
        }
        if (aZIndex < bZIndex) {
          return -1;
        } else if (aZIndex > bZIndex) {
          return 1;
        } else {
          return 0;
        }
      }.bind(this));
      for (let i = 0; i < lineIds.length; i++) {
        const lineGroup = d3.select('.line-' + this.lines[lineIds[i]].svgId).node();
        if (lineGroup) {
          lineGroup.parentNode.appendChild(lineGroup);
        }
      }

      this.stopMouseEvents();
      const timestamp = Date.now();
      this.animationTimestamp = timestamp;
      setTimeout(function() {
          if (this.animationTimestamp == timestamp) {
            // no new animations started
            this.startMouseEvents();
          }
        }.bind(this), this.params.transition_time);
    },

    scaleAxes: function() { // private
      const combinedData = Object.keys(this.lines).reduce(function(accumulated, lineId) { Array.prototype.push.apply(accumulated, this.lines[lineId].data); return accumulated; }.bind(this), []);
      const xDomain = d3.extent(combinedData, this.params.get_data_x);
      const xLBound = (this.params.x_axis_lbound != undefined) ? this.params.x_axis_lbound : d3.interpolate(xDomain[0], xDomain[1])(-0.03);
      const xUBound = (this.params.x_axis_ubound != undefined) ? this.params.x_axis_ubound : d3.interpolate(xDomain[0], xDomain[1])(1.03); 
      this.xAxis.domain([xLBound, xUBound]);
      
      let oneDay = 86400000;
      let oneMonthMin = oneDay * 4 * 7;
      let xTicks = this.xAxis.ticks();
      let firstDate = xDomain[0];
      let endDate = xDomain[1];
      let xLabelDiff = 0;
      for (let i = 0; i < xTicks.length - 1; ++i) {
        xLabelDiff = Math.max(xLabelDiff, Math.abs(xTicks[i].valueOf() - xTicks[i + 1].valueOf()));
      }
      
      let xTicksModified = [];
      // check if the diff between two dates is greater than one month
      if (xLabelDiff >= oneMonthMin) {
        // use xTicks but not include the tick if greater than end date
        for (let i = 0; i < xTicks.length; ++i) {
          if (xTicks[i] < endDate) {
            xTicksModified.push(xTicks[i]);
          }
        }
        // add first date at the begining if has enough space
        if ((xTicksModified[0] - firstDate) / (endDate - firstDate) >= 0.03) {
          xTicksModified.unshift(firstDate)
        }
      } else {
        // start from first date, increment the dates by xLabelDiff
        for (let i = 0; i < xTicks.length; ++i) {
          let dt = new Date((xLabelDiff * i) + firstDate.getTime());
          // push dates if smaller than end date
          if (dt < endDate) {
            xTicksModified.push(dt);
          }
        }
      }
      // add end date at the end if has enough space
      if ((endDate - xTicksModified[xTicksModified.length - 1]) / (endDate - firstDate) >= 0.03) {
        xTicksModified.push(endDate);
      }

      let yDomain = d3.extent(combinedData, this.params.get_data_y);
      if (yDomain[0] === 0 && yDomain[1] === 0) yDomain[1] = 1;
      const yLBound = (this.params.y_axis_lbound != undefined) ? this.params.y_axis_lbound : d3.interpolate(yDomain[0], yDomain[1])(-0.03);
      const yUBound = (this.params.y_axis_ubound != undefined) ? this.params.y_axis_ubound : d3.interpolate(yDomain[0], yDomain[1])(1.03);

      this.yAxis.domain([yLBound, yUBound]);

      this.graphGroup.select('.x-axis').transition().duration(this.params.transition_time).call(d3.axisBottom(this.xAxis).tickFormat(this.params.tick_format_x).tickSizeInner(15).tickSizeOuter(0).tickValues(xTicksModified));
      this.graphGroup.select('.y-axis').transition().duration(this.params.transition_time).call(d3.axisLeft(this.yAxis).tickFormat(this.params.tick_format_y).tickSizeInner(-this.gridSize.width).tickSizeOuter(0));
    },

    animateAddLines: function(graphLines) { // private
      // Add lines at the bottom of the graph
      const graphGroup = graphLines.enter()
      .append('g')
        .attr('clip-path', 'url(#gridClip)')
        .attr('class', function(lineId) { 
                              const lineParams = this.lines[lineId];
                              lineParams.svgId = this.curLineId++;
                              return 'line-group ' + this.lines[lineId].class + ' line-' + lineParams.svgId;
                        }.bind(this));

      graphGroup.append('path').attr('class', function(lineId) { return 'line'; }).style('opacity', 0)
        .attr('d', function(lineId) {
          const lineParams = this.lines[lineId];
          const x1 = this.xAxis(this.params.get_data_x(lineParams.data[0]));
          const x2 = this.xAxis(this.params.get_data_x(lineParams.data[lineParams.data.length - 1]));
          lineParams.points = [{ '__x': x1, '__y': this.gridSize.height }, { '__x': x2, '__y': this.gridSize.height }];
          return this.pointsToPathD(lineParams.points);
        }.bind(this));

      const allLines = this.lines;
      const that = this;
      graphGroup.each(function(lineId, index, lineGroups) {
        if (!allLines[lineId].displayHover) {
          return;
        }
        d3.select(this).append('g').classed('hover', true).style('visibility', 'hidden').html(
          allLines[lineId].displayHover(that.getDimensions()));
      });
    },

    animateRemoveLines: function(graphLines, oldLineData) { // private
      graphLines.exit()
      .each(function(lineId) {
              const lineParams = oldLineData[lineId];
              const x1 = lineParams.points[0].__x;
              const x2 = lineParams.points[lineParams.points.length - 1].__x;
              const y = this.gridSize.height;
              this.animateUpdateLine(lineParams, true, [ { '__x': x1, '__y': y }, { '__x': x2, '__y': y } ]);
      }.bind(this));
    },

    animateUpdateLine: function(lineParams, isRemovingLine, newPoints) { // private
      const oldPoints = lineParams.points;
      var newPoints = newPoints ? newPoints : this.dataToPoints(lineParams.data);
      const oldDomain = d3.extent(oldPoints, function(p) { return p.__x; });
      const newDomain = d3.extent(newPoints, function(p) { return p.__x; });

      const oldXVals = oldPoints.map(function(p) { return (p.__x - oldDomain[0]) / (oldDomain[1] - oldDomain[0]); });
      const newXVals = newPoints.map(function(p) { return (p.__x - newDomain[0]) / (newDomain[1] - newDomain[0]); });
      let xVals = oldXVals.concat(newXVals);
      xVals.sort();

      // Remove duplicates
      let tempArray = [xVals[0]];
      for (let i = 1; i < xVals.length; i++) {
        if (xVals[i - 1] != xVals[i]) {
          tempArray.push(xVals[i]);
        }
      }
      xVals = tempArray;
      const interpolatedOldPoints = [];
      const interpolatedNewPoints = [];

      const bisector = d3.bisector(function(p) { return p.__x; }).left;


      for (let i = 0; i < xVals.length; i++) {
        const oldPoint = this.pointInterpolate(oldPoints, (1 - xVals[i]) * oldDomain[0] + xVals[i] * oldDomain[1], bisector);
        interpolatedOldPoints.push(oldPoint);
        const newPoint = this.pointInterpolate(newPoints, (1 - xVals[i]) * newDomain[0] + xVals[i] * newDomain[1], bisector);
        interpolatedNewPoints.push(newPoint);
      }

      const tween = d3.interpolate(interpolatedOldPoints, interpolatedNewPoints);

      const lineGroup = this.graphGroup.select('g.line-' + lineParams.svgId);
      const linePoints = lineGroup.selectAll('g.point');
      linePoints.each(function(lineId, i, nodes) {
        const d3Node = d3.select(nodes[i]);
        const rawX = Number(d3Node.attr('transform').split(/[(,)]/)[1]);
        if (!rawX) {
          return;
        }
        let xVal = (rawX - oldDomain[0]) / (oldDomain[1] - oldDomain[0]);
        const point = this.pointInterpolate(newPoints, (1 - xVal) * newDomain[0] + xVal * newDomain[1], bisector);
        d3Node.transition().duration(this.params.transition_time).style('opacity', 0).attr('transform', 'translate(' + point.__x + ', ' + point.__y + ')').remove();
      }.bind(this));

      const lineTransition = lineGroup.select('.line').transition().duration(this.params.transition_time)
        .style('opacity', 1)
        .attrTween('d', function() { return function(t) {
        let interpolatedPoints;
        if (t == 0) {
          interpolatedPoints = oldPoints;
        } else if (t == 1) {
          interpolatedPoints = newPoints;
        } else {
          interpolatedPoints = tween(t);
        }
        lineParams.points = interpolatedPoints;
        return this.pointsToPathD(interpolatedPoints);
      }.bind(this); }.bind(this));

      if (isRemovingLine) {
        lineTransition.style('opacity', 0).on('end', function() {
          this.graphGroup.select('g.line-' + lineParams.svgId).style('opacity', 0).remove();
        }.bind(this));
      } else {
        lineTransition.on('end', () => lineParams.points = newPoints );
        newPoints.map(function(p, i) {
          let xVal = (p.__x - newDomain[0]) / (newDomain[1] - newDomain[0]);
          const point = this.pointInterpolate(oldPoints, (1 - xVal) * oldDomain[0] + xVal * oldDomain[1], bisector);
          if (lineParams.displayPoint) {
            lineGroup.append('g').classed('point', true).attr('transform', 'translate(' + point.__x + ', ' + point.__y + ')')
              .html(lineParams.displayPoint(this.getDimensions({ x: p.__x, y: p.__y }), lineParams.id, lineParams.data[i]))
              .style('opacity', 0).transition().duration(this.params.transition_time).style('opacity', 1).attr('transform', 'translate(' + p.__x + ', ' + p.__y + ')')
          }
        }.bind(this));
      }

      return lineTransition;
    },

    pointInterpolate: function(data, xVal, bisector) {
      const index = bisector(data, xVal);
      if (index <= 0) {
        return data[0];
      } else if (index >= data.length) {
        return data[data.length - 1];
      }
      const x1 = data[index - 1].__x;
      const x2 = data[index].__x;
      const p = (xVal - x1) / (x2 - x1);
      return {
        '__x': data[index - 1].__x * (1 - p) + data[index].__x * p,
        '__y': data[index - 1].__y * (1 - p) + data[index].__y * p
      };
    },

    dataToPoints: function(data) {
      return data.map(function(dataVal) {
        return {
          '__x': this.xAxis(this.params.get_data_x(dataVal)),
          '__y': this.yAxis(this.params.get_data_y(dataVal))
        };
      }.bind(this));
    },

    pointsToPathD: d3.line().x(function(p) { return p.__x; }).y(function(p) { return p.__y; }),

    chooseClosestPoint: function(mouseLoc, eventType) {
      if (mouseLoc.x < 0 || mouseLoc.x > this.gridSize.width ||
        mouseLoc.y < 0 || mouseLoc.y > this.gridSize.height) {
          return undefined;
      }

      const lines = Object.keys(this.lines)
        .map((lineId) => this.lines[lineId])
        .filter(function(lineParams) {
          return lineParams[eventType + '_radius'] != undefined;
        });
      
      if (lines.length <= 0) {
        return undefined;
      }
      let chosenLineParams, chosenPoint, chosenPointLoc, chosenDistSqr;
      for (let i = 0; i < lines.length; i++) {
        const curLineParams = lines[i];
        const mouseAreaRadiusSqr = Math.pow(curLineParams[eventType + '_radius'], 2);
        const linePoints = this.dataToPoints(curLineParams.data);
        for (let j = 0; j < linePoints.length; j++) {
          const distSqr = Math.pow(linePoints[j].__x - mouseLoc.x, 2) + Math.pow(linePoints[j].__y - mouseLoc.y, 2);
          if (distSqr <= mouseAreaRadiusSqr) {
            // Point is in range, determine which point to pick based on tiebreakers
            let usePoint = chosenLineParams == undefined;
            if (!usePoint) {
              if (distSqr > chosenDistSqr) {
                continue;
              } else if (distSqr < chosenDistSqr) {
                usePoint = true;
              }
            }
            if (!usePoint) {
              if (chosenLineParams.z_index > curLineParams.z_index) {
                continue;
              } else if (chosenLineParams.z_index < curLineParams.z_index) {
                usePoint = true;
              }
            }
            if (!usePoint) {
              if (chosenLineParams.id <= curLineParams.id) {
                continue;
              }
            }
            chosenLineParams = curLineParams;
            chosenPoint = curLineParams.data[j];
            chosenPointLoc = linePoints[j];
            chosenDistSqr = distSqr;
          }
        }
      }

      if (!chosenLineParams) {
        return undefined;
      }

      return {
        lineParams: chosenLineParams,
        point: chosenPoint,
        pointLoc: chosenPointLoc
      };
    },

    getDimensions: function(pointLoc, mouseLoc) {
      let result = {
        graphWidth: this.gridSize.width,
        graphHeight: this.gridSize.height
      };
      if (pointLoc) {
        Object.assign(result, {
          pointLeft: pointLoc.x,
          pointTop: pointLoc.y
        });
      }
      if (mouseLoc) {
        Object.assign(result, {
          mouseLeft: mouseLoc.x,
          mouseTop: mouseLoc.y
        });
      }
      return result;
    }

  });
}
