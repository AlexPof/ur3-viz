var RADIUS=350;
var SVG_SIZE = 800;

var START_DRAG = {"x":0,"y":0};
var DRAG_FLAG = 0;

var CIRCLE_SVG = d3.select("#svg_row").append("svg")
		.attr("width", SVG_SIZE)
		.attr("height", SVG_SIZE)
		.append("g")
		.attr("transform", "translate(" + SVG_SIZE/2 + "," + SVG_SIZE/2 + ")");

var NODE_DATA=[];
var NODE_NAMES=[];
var LINKS_DATA=[];

d3.json("/ur3-viz/transactional_network_poincare/poincare_embeddings.json", function(error, json_data) {
	if (error) throw error;

	for(var i=0;i<json_data.num_nodes;i++) {
		NODE_DATA.push({"name":json_data.nodes[i].NAME,
										"x":json_data.nodes[i].X,
										"y":json_data.nodes[i].Y,
										"coord_x":json_data.nodes[i].X,
										"coord_y":json_data.nodes[i].Y,
										"size":3,
										"color":"lightsteelblue"
									});
		NODE_NAMES.push(json_data.nodes[i].NAME);
	}
	NODE_DATA.push({"name":"",
									"x":0.0,
									"y":0.0,
									"coord_x":0.0,
									"coord_y":0.0,
									"size":5.0,
									"color":"black"
								});
	for(var i=0;i<json_data.links.length;i++) {
		var source_name = json_data.links[i][0];
		var target_name = json_data.links[i][1];
		LINKS_DATA.push({"source":NODE_NAMES.indexOf(source_name),
										 "target":NODE_NAMES.indexOf(target_name)
										})
	}

	draw_data();
});

function translate_coordinates(translation) {
	for(var i=0;i<NODE_DATA.length;i++) {
		var point_data = {"x":NODE_DATA[i].coord_x,"y":NODE_DATA[i].coord_y};
		var coordinates = hyperbolic_translate(point_data,translation)
		NODE_DATA[i].coord_x = coordinates.x;
		NODE_DATA[i].coord_y = coordinates.y;
	}
}

function dilate_coordinates(dilation) {
	for(var i=0;i<NODE_DATA.length;i++) {
		var point_data = {"x":NODE_DATA[i].coord_x,"y":NODE_DATA[i].coord_y};
		var coordinates = hyperbolic_dilate(point_data,dilation)
		NODE_DATA[i].coord_x = coordinates.x;
		NODE_DATA[i].coord_y = coordinates.y;
	}
}

function draw_data() {
	var circles = CIRCLE_SVG.selectAll("g.node").data(NODE_DATA);

	var new_circles = circles.enter().append("g").attr("class","node");

	new_circles.append("circle")
						.attr("stroke", "#fff")
						.attr("stroke-width", 1.5)
						.attr("cx",function(d) {return RADIUS*d.coord_x;})
						.attr("cy",function(d) {return RADIUS*d.coord_y;})
						.attr("r", function(d) {return d.size;})
						.attr("fill", function(d) {return d.color;});
	new_circles.append("text")
						 .classed('unselectable_text', true)
						 .attr("x",function(d) {return RADIUS*d.coord_x;})
						 .attr("y",function(d) {return RADIUS*d.coord_y;})
						 .attr("font-family","Raleway")
						 .attr("font-size","10")
						 .attr("text-anchor", d => d.coord_x < 0 ? "end" : null)
						 .text(function(d) {return d.name;});

	var links = CIRCLE_SVG.selectAll("path.link").data(LINKS_DATA);

	links.enter().append("path")
					  .attr("class","link")
						.attr("stroke", "steelblue")
						.attr("stroke-width", 1.0)
						.attr("opacity", 0.05)
						.attr("fill", "none")
						.attr("d",get_arc_path);

	CIRCLE_SVG.append("g")
						.attr("class","boundary")
						.attr("fill","transparent")
						.attr("stroke","black")
						.attr("stroke-width",0.5)
						.append("circle")
						.attr("cx",0)
						.attr("cy",0)
						.attr("r",RADIUS)
						.call(d3.drag()
										 .on("start", function() {
																							var pos_x = d3.event.x/RADIUS;
																							var pos_y = d3.event.y/RADIUS;
																							var norm = pos_y*pos_y+pos_x*pos_x;
																							if (norm<1) {
																								START_DRAG={"x":pos_x,
																														"y":pos_y};
																								DRAG_FLAG=1;
																							}
																						}
											)
										 .on("drag", function() { 		var pos_x = d3.event.x/RADIUS;
																									var pos_y = d3.event.y/RADIUS;
																									var norm = pos_y*pos_y+pos_x*pos_x;
																									if (norm<1 && DRAG_FLAG==1) {
																										translate_coordinates({"x":pos_x-START_DRAG.x,"y":pos_y-START_DRAG.y});
																										update_data();
																										START_DRAG={"x":pos_x,
																																"y":pos_y};
																									}
																							}
											)
											.on("end",function() {DRAG_FLAG=0;})
										);
}

function update_data() {
	var circles = CIRCLE_SVG.selectAll("g.node").data(NODE_DATA);

	circles.select("circle")
				 .attr("cx",function(d) {return RADIUS*d.coord_x;})
				 .attr("cy",function(d) {return RADIUS*d.coord_y;});
  circles.select("text")
				 .attr("text-anchor", d => d.coord_x < 0 ? "end" : null)
			 	 .attr("x",function(d) {return RADIUS*d.coord_x;})
			 	 .attr("y",function(d) {return RADIUS*d.coord_y;});

	var links = CIRCLE_SVG.selectAll("path.link").data(LINKS_DATA);

	links.attr("d",get_arc_path);
}

function get_arc_path(d) {
	var px = NODE_DATA[d.source].coord_x;
	var py = NODE_DATA[d.source].coord_y;
	var qx = NODE_DATA[d.target].coord_x;
	var qy = NODE_DATA[d.target].coord_y;

	var cx = (qy*(px*px+py*py+1)-py*(qx*qx+qy*qy+1))/(2*(px*qy-py*qx));
	var cy = (-qx*(px*px+py*py+1)+px*(qx*qx+qy*qy+1))/(2*(px*qy-py*qx));
	var r = Math.sqrt(cx*cx+cy*cy-1);
	if (isNaN(r)) {
		return "";
	}

	var cross_prod = (px-cx)*(qy-cy)-(py-cy)*(qx-cx);
	// Determines the orientation (angle positive/negative)
	if (cross_prod<0) {
			var the_path="M"+(RADIUS*px).toString()+","+(RADIUS*py).toString();
			the_path += " A "+(RADIUS*r).toString()+" "+(RADIUS*r).toString()+" 0 0,0 ";
			the_path += (RADIUS*qx).toString()+","+(RADIUS*qy).toString();
	} else {
			var the_path="M"+(RADIUS*qx).toString()+","+(RADIUS*qy).toString();
			the_path += " A "+(RADIUS*r).toString()+" "+(RADIUS*r).toString()+" 0 0,0 ";
			the_path += (RADIUS*px).toString()+","+(RADIUS*py).toString();
	}


	return the_path
}

function hyperbolic_translate(point_data,translation) {
	var x = point_data.x;
	var y = point_data.y;
	var vx = translation.x;
	var vy = translation.y;
	var v2 = vx*vx+vy*vy;
	var x2 = x*x+y*y;

	data = {"x":((1+2*(vx*x+vy*y)+x2)*vx+(1-v2)*x)/(1+2*(vx*x+vy*y)+v2*x2),
					"y":((1+2*(vx*x+vy*y)+x2)*vy+(1-v2)*y)/(1+2*(vx*x+vy*y)+v2*x2)};

	return data;
}
