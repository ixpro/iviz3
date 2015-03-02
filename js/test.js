        var  widthCircle = 350,
             heightCircle = 350;

        var y = d3.scale.ordinal().domain(d3.range(1)).rangePoints([0, heightCircle]);

        var counter = 0;
        var svgPulse = d3.select("#pulse")
            .append("svg")
            .attr("width", widthCircle)
            .attr("height", heightCircle)
            .attr("transform", "translate(" + widthCircle / 2 + "," + heightCircle/ 2 + ")");

        // Define the gradient
        var gradient = svgPulse.append("svg:defs")
            .append("svg:radialGradient")
            .attr("id", "gradient")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "100%")
            .attr("spreadMethod", "pad");
        
        // Define the gradient colors
        gradient.append("svg:stop")
            .attr("offset", "0%")
            .attr("stop-color", "#121314") // neutral color
            .attr("stop-opacity", 1);
        
        gradient.append("svg:stop")
            .attr("offset", "100%")
            .attr("stop-color", "#121314") //neutral color
            .attr("stop-opacity", 1);
       

        var settings = {
            warmWater : {
                 stopColor : "#A83B0C"   //transit to red
            },

            coldWater: {
                 stopColor : "#0C79A8" // transit to blue
            },

            electricity: {
                 stopColor : "#B0A237" // transit to yellow
            },

            balanced: {
                 stopColor : "#5C5C5C" // transit to neutral
            }
        } 

        var gradURL = 'url(#gradient)';

        svgPulse.selectAll("circle")
            .data(y.domain())
            .enter()
            .append("circle")
            .attr("stroke-width", 0)
            .attr("r", 110)
            .attr('fill', "none")
            .attr("cx", widthCircle / 2)
            .attr("cy", y);


        function changePulseColor(param){
             //alert(param);
             // gradURL = settings[param].gradURL;
             // gradObj = settings[param].gradObj;
             stopColor = settings[param].stopColor;
               
             var c = d3.select("circle");
                 c.transition()
                    .duration( 0 );

            gradient.select("stop")
                 .transition()
                 .duration(3000)
                 .attr("stop-color", "#121314")
                 .attr("stop-opacity", 1);                    

            gradient.select("stop")
                 .transition()
                 .duration(3000)
                 .attr("stop-color", stopColor)
                 .attr("stop-opacity", 1);

             $("#message").html(param);
             pulse();
        }
       


        function pulse() {
            var circle = svgPulse.select("circle");

            (function repeat() {

                // if(flag == 0) return;                               
                circle = circle.transition()
                    .duration(2000)
                    .attr("stroke-width", 0)
                    .attr('fill', gradURL)
                    .attr("r", 110)
                    .transition()
                    .duration(2000)
                    .attr("r", 80)
                    .ease('sine')
                    .each("end", repeat);
            })();
        }
        

       


