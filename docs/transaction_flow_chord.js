var chord_data;

var margin = {left:90, top:90, right:90, bottom:90},
		width = Math.min(window.innerWidth, 1000) - margin.left - margin.right,
		height = Math.min(window.innerWidth, 1000) - margin.top - margin.bottom,
		innerRadius = Math.min(width, height) * .39,
		outerRadius = innerRadius * 1.1;


		var CHORD_SVG = d3.select("#chart").append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
		.attr("transform", "translate(" + (width/2 + margin.left) + "," + (height/2 + margin.top) + ")");


var START_YEAR = 2048;
var END_YEAR = 2047;

var MERCH_DATA;
var NAMES=[];
var FLOW_MATRIX = [];
var GOODS=[];
var YEAR_DATA=[];

d3.json("/transaction_flow_data.json", function(error, json_data) {
	if (error) throw error;

	MERCH_DATA = json_data.qties;
	YEAR_DATA = json_data.YEAR_DATA;
	GOODS = Object.keys(MERCH_DATA[0]);
	GOODS = GOODS.filter(function(x) { return (x!=="SENDER" && x!=="RECEIVER" && x!=="YEAR_BC"); });

	var cb_html = "<form>";
	cb_html += '<p style="font-family: Roboto Condensed, sans-serif; font-size:16px; font-weight:300;">Goods</p>';
	for (var i=0;i<GOODS.length;i++) {
		cb_html += '<div class="form-group form-check">';
		cb_html += '<input class="form-group form-check-input" type="checkbox" value="" id="check_'+i.toString()+'" onClick="redraw_data();">';
  	cb_html += '<label class="form-group form-check-label" for="defaultCheck1" style="font-family: Roboto Condensed, sans-serif; font-size:12px; font-weight:300;">'+GOODS[i]+'</label>';
  	cb_html += '</div>';
	}
	cb_html += "</form>";
  d3.select("#all_checkboxes").html(cb_html);

	redraw_data();
	display_year(START_YEAR,END_YEAR);
});

var slider = d3.select("svg#slider").append("g");



var year_slider = d3.scaleLinear()
				.domain([2094, 2006])
				.range([10, 600])
				.clamp(true);

slider.append("line")
				.attr("x1", year_slider.range()[0])
				.attr("x2", year_slider.range()[1])
				.attr("y1", 25)
				.attr("y2", 25)
				.attr("stroke","#DDDDDD")
				.attr("stroke-width",6)
				.attr("stroke-linecap","round");

var selected_years_line = slider.append("line")
																.attr("class","line_selected_year")
																.attr("x1", year_slider(START_YEAR))
																.attr("x2", year_slider(END_YEAR))
																.attr("y1", 25)
																.attr("y2", 25)
																.attr("stroke","darkblue")
																.attr("stroke-width",6)
																.attr("stroke-linecap","round");

var handle_left = slider.insert("circle",".slider-overlay")
						.attr("class","handle")
						.attr("filter","url(#dropshadow)")
						.attr("fill","lightsteelblue")
						.attr("opacity",0.8)
						.attr("cy",25)
						.attr("cx",year_slider(START_YEAR))
						.call(d3.drag()
								.on("start.interrupt", function() { slider.interrupt(); })
								.on("end drag", function() { var pos_x = d3.event.x;
																						if (pos_x>handle_right.attr("cx")) pos_x = handle_right.attr("cx");
																						START_YEAR = year_slider.invert(pos_x);
																						handle_left.attr("cx", year_slider(START_YEAR));
																						START_YEAR = Math.round(START_YEAR);
																						selected_years_line.attr("x1",year_slider(START_YEAR));
																						selected_years_line.attr("x2",year_slider(END_YEAR));
																						 redraw_data();
																						 display_year(START_YEAR,END_YEAR);
																						}) );

var handle_right = slider.insert("circle",".slider-overlay")
					.attr("class","handle")
					.attr("filter","url(#dropshadow)")
					.attr("fill","lightsteelblue")
					.attr("opacity",0.8)
					.attr("cy",25)
					.attr("cx",year_slider(END_YEAR))
					.call(d3.drag()
							.on("start.interrupt", function() { slider.interrupt(); })
							.on("end drag", function() { var pos_x = d3.event.x;
																					if (pos_x<handle_left.attr("cx")) pos_x = handle_right.attr("cx");
																					END_YEAR = year_slider.invert(pos_x);
																					handle_right.attr("cx", year_slider(END_YEAR));
																					END_YEAR = Math.round(END_YEAR);
																					selected_years_line.attr("x1",year_slider(START_YEAR));
																					selected_years_line.attr("x2",year_slider(END_YEAR));
																					redraw_data();
																					display_year(START_YEAR,END_YEAR);
																					}) );    //add zoom capabilities


function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}

function display_year(y_start,y_end) {
	d3.select("#p_year").html(y_start+" BC - "+YEAR_DATA[y_start]+" to <br>"+y_end+" BC - "+YEAR_DATA[y_end]);
}

function redraw_data() {

	////////////////////////////////////////////////////////////
	//////////////////////// Set-Up ////////////////////////////
	////////////////////////////////////////////////////////////

	keywords = []
	for (var i=0;i<GOODS.length;i++) {
		if (d3.select("#check_"+i.toString()).property("checked")){
			keywords.push(GOODS[i]);}
	}
	colors = ["#301E1E", "#083E77", "#342350", "#567235", "#8B161C", "#DF7C00"];

  NAMES=[]
	for(var i=0;i<MERCH_DATA.length;i++) {
		var year = MERCH_DATA[i].YEAR_BC;
		var qty = 0;
		for (var j=0;j<keywords.length;j++){
		 	qty+= MERCH_DATA[i][keywords[j]];
		}
		if (year<=START_YEAR && year>=END_YEAR && qty>0) {
			NAMES.push(MERCH_DATA[i].SENDER);
			NAMES.push(MERCH_DATA[i].RECEIVER);
		}
	}
	NAMES = NAMES.filter( onlyUnique );

	FLOW_MATRIX=[];
	var sym_matrix = [];
	for(var i=0;i<NAMES.length;i++) {
		FLOW_MATRIX[i]=[];
		sym_matrix[i]=[];
		for(var j=0;j<NAMES.length;j++) {
			FLOW_MATRIX[i][j]=0.0;
			sym_matrix[i][j]=0.0;
		}
	}

	for(var i=0;i<MERCH_DATA.length;i++) {
		var source_idx = NAMES.indexOf(MERCH_DATA[i].SENDER);
		var target_idx = NAMES.indexOf(MERCH_DATA[i].RECEIVER);
		var qty = 0;
		for (var j=0;j<keywords.length;j++){
		 	qty+= MERCH_DATA[i][keywords[j]];
		}
		var year = MERCH_DATA[i].YEAR_BC;
		if (year<=START_YEAR && year>=END_YEAR && qty>0) {
			FLOW_MATRIX[source_idx][target_idx] += qty;
			FLOW_MATRIX[target_idx][source_idx] -= qty;
		}
	}

	for(var i=0;i<NAMES.length;i++) {
		for(var j=0;j<NAMES.length;j++) {
      var value = Math.abs(FLOW_MATRIX[i][j]);
      sym_matrix[i][j] = value;
		}
	}


	////////////////////////////////////////////////////////////
	/////////// Create scale and layout functions //////////////
	////////////////////////////////////////////////////////////

	var opacityDefault = 1.0;

	var chord = d3.chord()
	    .padAngle(.03)
	    .sortChords(d3.descending);

	var arc = d3.arc()
	    .innerRadius(innerRadius*1.01)
	    .outerRadius(outerRadius);

	var path = d3.ribbon()
			.radius(innerRadius);

	chord_data = chord(sym_matrix);

	var outerArcs = CHORD_SVG.selectAll("g.group").data(chord_data.groups, function(d) {return NAMES[d.index]});

	outerArcs.exit().remove();

  var new_groups = outerArcs.enter().append("g")
					 .attr("class", "group")
					 .on("mouseover", function (d,i) {
						 CHORD_SVG.selectAll("path.chord")
			 	        			.filter(function(d) { return d.source.index != i && d.target.index != i; })
			 								.transition()
			 	        			.style("opacity", 0.1);
						var tooltip_div = d3.select("#tooltip_div");
						tooltip_div.transition()
											 .duration(200)
											 .style("opacity", 0.9);
						tooltip_div.html("Total number handled:<br>"+d.value.toString())
											 .style("left", (d3.event.pageX) + "px")
											 .style("top", (d3.event.pageY - 28) + "px");
					 })
					 .on("mouseout", function (d,i) {
						 CHORD_SVG.selectAll("path.chord")
			 	        			.filter(function(d) { return d.source.index != i && d.target.index != i; })
			 								.transition()
			 	        			.style("opacity", 1.0);
						 var tooltip_div = d3.select("#tooltip_div");
				 		tooltip_div.transition()
				 							 .duration(200)
				 							 .style("opacity", 0.0);
					 });

  new_groups.append("path")
						.style("fill", "darkgray")
 						.style("fill-opacity", "0.4")
 						.style("stroke", "darkgray")
 						.style("stroke-opacity", "0.6")
 						.attr("d", arc);
  new_groups.append("text")
						.each(function(d) { d.angle = (d.startAngle + d.endAngle) / 2; })
						.attr("dy", ".35em")
						.attr("class", "titles")
						.text(function(d,i) { return NAMES[d.index]; })
						.attr("text-anchor", function(d) { return d.angle > Math.PI ? "end" : null; })
						.attr("transform", function(d) {
										 return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")"
										 + "translate(" + (outerRadius + 10) + ")"
										 + (d.angle > Math.PI ? "rotate(180)" : "");
									 });

	outerArcs.select("path")
					 .style("fill", "darkgray")
					 .style("fill-opacity", "0.4")
					 .style("stroke", "darkgray")
					 .style("stroke-opacity", "0.6")
					 .attr("d", arc);
	outerArcs.select("text")
					 .each(function(d) { d.angle = (d.startAngle + d.endAngle) / 2; })
					 .attr("dy", ".35em")
					 .attr("class", "titles")
					 .text(function(d,i) { return NAMES[d.index]; })
					 .attr("text-anchor", function(d) { return d.angle > Math.PI ? "end" : null; })
					 .attr("transform", function(d) {
										return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")"
										+ "translate(" + (outerRadius + 10) + ")"
										+ (d.angle > Math.PI ? "rotate(180)" : "");
									});



  var chords = CHORD_SVG.selectAll("path.chord").data(chord_data, function(d) {return NAMES[d.source.index]+"-"+NAMES[d.target.index];});

	chords.exit().remove();

	chords.enter().append("path").attr("class", "chord")
				.style("fill", "lightsteelblue")
					.style("fill-opacity","0.5")
					.style("stroke","black")
					.style("stroke-opacity","0.25")
					//.style("fill", function(d) { return colors(d.source.index); })
					.style("opacity", opacityDefault)
					.on("mouseover", function (d,i) {
					var tooltip_div = d3.select("#tooltip_div");
					 tooltip_div.transition()
											.duration(200)
											.style("opacity", 0.9);
					var the_html = "";

					if (FLOW_MATRIX[d.source.index][d.target.index]>0.0) {
						the_html += NAMES[d.source.index]+" ➡ "+NAMES[d.target.index];
						the_html += "<br>Qty:"+[d.source.value].toString();
					} else {
						the_html += NAMES[d.target.index]+" ➡ "+NAMES[d.source.index];
						the_html += "<br>Qty:"+[d.target.value].toString();
					}
					 tooltip_div.html(the_html)
											.style("left", (d3.event.pageX) + "px")
											.style("top", (d3.event.pageY - 28) + "px");
					})
					.on("mouseout", function (d,i) {
					var tooltip_div = d3.select("#tooltip_div");
					 tooltip_div.transition()
											.duration(200)
											.style("opacity", 0.0);
					})
					//.attr("d", path); // Standard chord function
					.attr("d",customArc(innerRadius,0.3))

	chords.style("fill", "lightsteelblue")
		.style("fill-opacity","0.5")
		.style("stroke","black")
		.style("stroke-opacity","0.25")
		//.style("fill", function(d) { return colors(d.source.index); })
		.style("opacity", opacityDefault)
		//.attr("d", path); // Standard chord function
		.attr("d",customArc(innerRadius,0.3))

		function customArc(radius,ratio) {
			return function (d,i) {
				context = d3.path();
				s_sa = d.source.startAngle-3.1416/2.;
				s_ea = d.source.endAngle-3.1416/2.;
				t_sa = d.target.startAngle-3.1416/2.;
				t_ea = d.target.endAngle-3.1416/2.;
				arrow_offset = radius-7*ratio*Math.sqrt(radius*(t_ea-t_sa));

				if (FLOW_MATRIX[d.source.index][d.target.index]>0.0){
					context.moveTo(radius*Math.cos(s_sa), radius*Math.sin(s_sa));
					context.arc(0, 0, radius, s_sa, s_ea);
					context.quadraticCurveTo(0, 0, arrow_offset*Math.cos(t_sa), arrow_offset*Math.sin(t_sa));
					context.lineTo(radius*Math.cos(0.5*t_sa+0.5*t_ea), radius*Math.sin(0.5*t_sa+0.5*t_ea))
					context.lineTo(arrow_offset*Math.cos(t_ea), arrow_offset*Math.sin(t_ea))
					context.quadraticCurveTo(0, 0, radius*Math.cos(s_sa), radius*Math.sin(s_sa));
					context.closePath();
				} else {
					context.moveTo(radius*Math.cos(t_sa), radius*Math.sin(t_sa));
					context.arc(0, 0, radius, t_sa, t_ea);
					context.quadraticCurveTo(0, 0, arrow_offset*Math.cos(s_sa), arrow_offset*Math.sin(s_sa));
					context.lineTo(radius*Math.cos(0.5*s_sa+0.5*s_ea), radius*Math.sin(0.5*s_sa+0.5*s_ea))
					context.lineTo(arrow_offset*Math.cos(s_ea), arrow_offset*Math.sin(s_ea))
					context.quadraticCurveTo(0, 0, radius*Math.cos(t_sa), radius*Math.sin(t_sa));
					context.closePath();
				}
				return context;
			};
		}

}
