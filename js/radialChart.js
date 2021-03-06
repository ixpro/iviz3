// WIDTH, HEIGHT
var width = 350,
    height = 330,
    outerRadius = height / 2 - 10, //Adjust for upper height of stacked graph
    innerRadius = 100; //Adjust for height lower height of stacked graph

var formatDate = d3.time.format("%H"),
    formatDay = function(d) { return formatDate(new Date(2007, 0, 0, d)); };

var angle = d3.time.scale()
    .range([0, 2 * Math.PI]);

var radius = d3.scale.linear()
    .range([innerRadius, outerRadius]);

// var z = d3.scale.category20c();

var colors = ["#FCDF00", "#0099CC", "#B22222"];

var stack = d3.layout.stack()
    .offset("zero")
    .values(function(d) { return d.values; })
    .x(function(d) { return d.time; })
    .y(function(d) { return d.value; });

var nest = d3.nest()
    .key(function(d) { return d.key; });

var line = d3.svg.line.radial()
    .interpolate("cardinal")
    .angle(function(d) { return angle(d.time); })
    .radius(function(d) { return radius(d.y0 + d.y); });

var area = d3.svg.area.radial()
    .interpolate("cardinal")
    .angle(function(d) { return angle(d.time); })
    .innerRadius(function(d) { return radius(d.y0); })
    .outerRadius(function(d) { return radius(d.y0 + d.y); });

var svgChart = d3.select("#chart").append("svg")
    .attr("width", width)
    .attr("height", height)
  .append("g")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

var weekday = new Array(7);
weekday[0]=  "SUN";
weekday[1] = "MON";
weekday[2] = "TUE";
weekday[3] = "WED";
weekday[4] = "THU";
weekday[5] = "FRI";
weekday[6] = "SAT";


var allData;
var allDataSliced;
var currentDay;
var timer;

var avgElectricity = 0;
var avgWarmWater   = 0;
var avgColdWater   = 0;

var energyPrice = 1.2; //SEK per KW
var coldWPrice  = 18; //SEK per m3
var hotWPrice   = 48; //sek per m3

var period = 24; // 1 rotation on the graph;
var dataStep = "daily";


d3.csv("data/data.csv",type, function(loadedRows) {

    allData = loadedRows;

    computeAvg(allData);

    line.interpolate("cardinal")
    area.interpolate("cardinal-closed");

    currentDay = loadedRows.slice(0,period);
    allDataSliced = loadedRows.slice(period);

    //currentDay = frameDataHourly(currentDay);
    currentDay = frameData(currentDay, "daily");

    var data = currentDay.shift();

    var  exceder = getHighestConsumption(data);
    if (typeof exceder !== 'undefined') {
        // the variable is defined
        $("#waster").html(exceder);
        changePulseColor(exceder);
    }else
      {
        $("#waster").html("");
        changePulseColor("balanced");
      }

      timestamp = new Date(data[0].timestamp)
      timeStr = timestamp.formatDate("dd.MM.yyyy");
      timeStr += "</br>" + weekday[timestamp.getDay()] 
      $("#message").html(timeStr);
    var convData = convertData(data);
    loadData(convData);

    timer = setInterval(function () {tickLoad()}, 7000);
  });


  function changeStep(step){
  }


 function getHighestConsumption(rows){

      //computing average dayly consumtion
      var ElectricitySum = 0;
      var WarmWaterSum   = 0;
      var ColdWaterSum   = 0;

      for (var i = 0; i < rows.length; i++) {
        var row = rows[i];

        ElectricitySum  += row.energy;
        ColdWaterSum    += row.coldwater;
        WarmWaterSum    += row.warmwater;
      };

     rowsAvgElectricity = ElectricitySum / rows.length;
     rowsAvgWarmWater   = WarmWaterSum / rows.length;
     rowsAvgColdWater   = ColdWaterSum / rows.length;

     excededUtilities = [];

     if (rowsAvgElectricity > avgElectricity) excededUtilities.push({'type' : 'electricity', 'value' : rowsAvgElectricity * energyPrice});
     if (rowsAvgWarmWater   > avgWarmWater)   excededUtilities.push({'type' : 'warmWater', 'value':rowsAvgWarmWater * hotWPrice});
     if (rowsAvgColdWater   > avgColdWater)   excededUtilities.push({'type' : 'coldWater', 'value':rowsAvgColdWater * coldWPrice});

     if(excededUtilities.length > 0)
        {
             var theHighest = excededUtilities[0];
             for (var i = 1; i < excededUtilities.length; i++) {
                if (excededUtilities[i].value > theHighest.value) theHighest = excededUtilities[i];
             };
             return theHighest.type;
        }
  }


  function computeAvg (rows)
  {

    //computing average dayly consumtion
    var ElectricitySum = 0;
    var WarmWaterSum   = 0;
    var ColdWaterSum   = 0;

    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];

      ElectricitySum  += row.energy;
      ColdWaterSum    += row.coldwater;
      WarmWaterSum    += row.warmwater;
    };

      avgElectricity = ElectricitySum / rows.length;
      avgWarmWater   = WarmWaterSum / rows.length;
      avgColdWater   = ColdWaterSum / rows.length;
  }

  function tickLoad(){

      data = currentDay.shift();

      //$("#message").html(data[0].timestamp.toDateString());

      // if day has finished, take the next day from allDataSliced
      if(!data) {

        if(allDataSliced.length == 0){
            stopTimer();
            return;
        }
        currentDay = allDataSliced.slice(0,period);
        allDataSliced = allDataSliced.slice(period);
        //currentDay = frameDataHourly(currentDay);
        currentDay = frameData(currentDay, "daily"); 
        data = currentDay.shift();
      }
        
      var  exceder = getHighestConsumption(data);
      if (typeof exceder !== 'undefined') {
          // the variable is defined
          $("#waster").html(exceder);
          changePulseColor(exceder);
      }else
        {
          $("#waster").html("");
          changePulseColor("balanced");
        }

      timestamp = new Date(data[0].timestamp)
      timeStr = timestamp.formatDate("dd.MM.yyyy");
      timeStr += "</br>" + weekday[timestamp.getDay()] 
      $("#message").html(timeStr);

      var convData = convertData(data);
      updateChart(convData);
  }

  function stopTimer(){
    clearInterval(timer);
  }

  function loadData(data)
      {

          var layers = stack(nest.entries(data));

          // Extend the domain slightly to match the range of [0, 2p].
          // angle.domain([0, d3.max(data, function(d) { return d.time + 1; })]);
          angle.domain([0, d3.max(data, function(d) { return 24; })]); // 24 hour clock (number of ticks)
          radius.domain([0, d3.max(data, function(d) { return d.y0 + d.y; })]);

          svgChart.selectAll(".layer")
              .data(layers)
            .enter().append("path")
              .attr("class", "layer")
              .attr("d", function(d) { return area(d.values); })
              .style("fill", function(d, i) { return colors[i]; });

          svgChart.selectAll(".axis")
              .data(d3.range(angle.domain()[1]))
            .enter().append("g")
              .attr("class", "axis")
              .attr("transform", function(d) { return "rotate(" + angle(d) * 180 / Math.PI + ")"; })
            .call(d3.svg.axis()
              .scale(radius.copy().range([-innerRadius, -outerRadius]))
              .orient("left"))
            .append("text")
              .attr("y", -innerRadius + 6)
              .attr("dy", ".71em")
              .attr("text-anchor", "middle")
              .text(function(d) { 
                  return ".";
                  ///  return formatDay(d); 
                });
      }

  function updateChart(data)
  {

        var layers = stack(nest.entries(data));
          // Extend the domain slightly to match the range of [0, 2p].
        //angle.domain([0, d3.max(data, function(d) { return d.time + 1; })]);
        angle.domain([0, d3.max(data, function(d) { return 24; })]);
        radius.domain([0, d3.max(data, function(d) { return d.y0 + d.y; })]);

        svgChart.selectAll(".layer")
              .data(layers)

        svgChart.selectAll(".axis")
              .data(d3.range(angle.domain()[1]))

         svgChart.selectAll("path")
              .transition()
              .duration( 500 )
              .attr("d", function(d) { 
                      if(d)
                        return area(d.values); 
                  })
              .style("fill", function(d, i) { 
                        return colors[i]; 
                      })
  }


   function convertData(rows)
    {
        var temp = [];
        for (var i = 0; i < rows.length; i++) {

          var row = rows[i];
          energyVal    = row.energy * energyPrice;
          coldwaterVal = row.coldwater * coldWPrice;
          warmwaterVal = row.warmwater  * hotWPrice;

          var obj = {};

          obj = {key : "energy",    time: row.time, value: energyVal, timestamp: row.timestamp};
          temp.push(obj);

          obj = {key : "coldwater", time: row.time, value: coldwaterVal, timestamp: row.timestamp};
          temp.push(obj);

          obj = {key : "warmwater", time: row.time, value: warmwaterVal, timestamp: row.timestamp};
          temp.push(obj);
        };

        return temp;
    }




    Object.prototype.clone = function() {
      var newObj = (this instanceof Array) ? [] : {};
      for (i in this) {
        if (i == 'clone') continue;
        if (this[i] && typeof this[i] == "object") {
          newObj[i] = this[i].clone();
        } else newObj[i] = this[i]
      } return newObj;
    };


    function frameData(dataFrame, type)
    {
      if(dataStep == "daily")
        return generateDayOverview(dataFrame);
      else
        return generateHourlyTicks(dataFrame)

    }


    function generateDayOverview(data)
    {
        var step = 24; // have an overview of 24 hours
        var days = [];
        var day=[];
        for (var i = 0; i < data.length; i++) {

            if(((i % step == 0)&&(i!==0))||(i == data.length -1))
            {
              //day.push(allData[0]);
              days.push(day);
              day =[];
            }

            day.push(data[i]);
            
        };
        return days;      
    }

     function generateHourlyTicks(dataFrame)
    {
        
        var step   = [dataFrame[0], dataFrame[1]];
        var result = [step];

        for (var i = 2; i < dataFrame.length; i++) {

            step = [];
            if((result.length>0))
              {
                step = result.clone();
                step = step.pop();
              }

            var tmp = dataFrame[i].clone();
            step.push(tmp);
            result.push(step);

            if(i % 23 == 0 ){
                var fin = result.clone();
                fin = fin.pop();
                tmp = dataFrame[0].clone();
                fin.push(tmp);
                result.push(fin);
            }
        };

        return result;
    }


    function type(d) {

      d.timestamp = d.time;
      d.time      = new Date(d.time).getHours();
      d.energy    = +d.energy;
      d.coldwater = +d.coldwater;
      d.warmwater = +d.warmwater;
      return d;
    }

Date.prototype.formatDate = function (format) {
    var date = this,
        day = date.getDate(),
        month = date.getMonth() + 1,
        year = date.getFullYear(),
        hours = date.getHours(),
        minutes = date.getMinutes(),
        seconds = date.getSeconds();
 
    if (!format) {
        format = "MM/dd/yyyy";
    }
 
    format = format.replace("MM", month.toString().replace(/^(\d)$/, '0$1'));
 
    if (format.indexOf("yyyy") > -1) {
        format = format.replace("yyyy", year.toString());
    } else if (format.indexOf("yy") > -1) {
        format = format.replace("yy", year.toString().substr(2, 2));
    }
 
    format = format.replace("dd", day.toString().replace(/^(\d)$/, '0$1'));
 
    if (format.indexOf("t") > -1) {
        if (hours > 11) {
            format = format.replace("t", "pm");
        } else {
            format = format.replace("t", "am");
        }
    }
 
    if (format.indexOf("HH") > -1) {
        format = format.replace("HH", hours.toString().replace(/^(\d)$/, '0$1'));
    }
 
    if (format.indexOf("hh") > -1) {
        if (hours > 12) {
            hours -= 12;
        }
 
        if (hours === 0) {
            hours = 12;
        }
        format = format.replace("hh", hours.toString().replace(/^(\d)$/, '0$1'));
    }
 
    if (format.indexOf("mm") > -1) {
        format = format.replace("mm", minutes.toString().replace(/^(\d)$/, '0$1'));
    }
 
    if (format.indexOf("ss") > -1) {
        format = format.replace("ss", seconds.toString().replace(/^(\d)$/, '0$1'));
    }
 
    return format;
};