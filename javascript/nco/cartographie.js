function Carte(parametres, articles, links) {

	var object = this;
	
	this.parametres = {
		
		isPositions: false,
		
		width: 1440,
		height: 800,
		top: 50,
		left: -240,
		boxID: "box",
		selectorID: "carto",
		canvasID: "canvas",
		info: "infos",
		
		couleurs: null,
		relations: null,
		
		charge: -30,
		gravity: .13,
		theta: 3,
		
		nodeSizeInterval: [3, 15],
		log: false,
		exp: false,
		layerStyle: {
			opacity: 0.6
		},
		handle_len_rate: 2.2,
		maxDistance: 35,
		
		scaleInterval: [0.5, 10],
		
		infobulleHtml: function(node) {return node.titre + "<p>cluster: " + node.group +"</p>";},
		
		activerZoom: true,
		activerNodeZoom: true,
		activerInfobulle: true,
		zoomNode: false,
		logZoomNode: false,
		logZoomNodeParameter: 2
	}
	
	this.beginDate = new Date(); 
	this.etendre(parametres);
	
	//cr√©ation du contenant sur la page, si inexistant
	

	
	if (null == (document.getElementById(this.parametres.boxID))) {
		d3.select('.content').append('div')
			.attr("id", this.parametres.boxID)
			.classed("gallery", true)
			.style("position", "absolute")
			.style("border", "1 px dashed");
	}
	d3.select('#' + this.parametres.boxID)
		.style("width", this.parametres.width)
		.style("height", this.parametres.height)
		.style("position", "absolute")
		.style("top", this.parametres.top)
		.style("left", this.parametres.left)
		.style("overflow", "hidden")
		.style('z-index', 0);
	
	
	if (null == (document.getElementById(this.parametres.selectorID))) {
		d3.select('.gallery').append('div')
			.attr("id", this.parametres.selectorID);
	}
	d3.select('#' + this.parametres.selectorID)
		.attr("width", this.parametres.width)
		.attr("height", this.parametres.height)
		.style("position", "absolute")
		.style('z-index', 2);
	
	this.drag = d3.behavior.drag()
	    .on("dragstart", function(d, i) {object.dragstart(d, i, object);})
	    .on("drag", object.dragmove)
	    .on("dragend", function(d, i) {object.dragend(d, i, object);});
		   
	this.static = false;
    
    if (this.parametres.activerNodeZoom) {
    	
    		this.nodeMouseover = function() { 
    			
    			scale = object.getScale(object.rect);
    			

				object.grow(this, scale); 
			};
			
			this.nodeMouseout = function(d) { 
				
				scale = object.getScale(object.rect);
    			
				object.shrink(object.radius(d.scaledPoids), this); 
			
			};
    }
    
    if (this.parametres.activerInfobulle) {
    	
		this.nodeClick = function(d) { 
			object.highlight(d); 
		};
		
		this.infoClick = function(d) { 
			object.blur(); 
		};
    }	
	
	//cr√©ation de l'infobulle, si inexistante
	if (null == (this.infoBulle = d3.select('#' + this.parametres.info)[0][0])) {
		this.infoBulle = d3.select('#' + this.parametres.selectorID).append('div')
			.attr("id", this.parametres.info)
			.style("top", this.parametres.height)
			.style("opacity", 0)
			.style("z-index", 1);
	}
	this.infoBulle.on("click", this.infoClick);
	
	//cr√©ation du canvas sur la page, si inexistant
	if (null == (this.canvas = document.getElementById(this.parametres.canvasID))) {
		d3.select('.gallery').insert('canvas', '#' + this.parametres.selectorID)
			.attr("id", this.parametres.canvasID)
			.attr("resize", false);
		this.canvas = document.getElementById(this.parametres.canvasID);
	}
	d3.select('#' + this.parametres.canvasID)
		.attr("width", d3.select('#' + this.parametres.selectorID).attr("width"))
		.attr("height", d3.select('#' + this.parametres.selectorID).attr("height"))
		.style("position", "absolute")
		.style("z-index", 1);
	
	object.mouse = {};
	object.isDown = false;
	object.drag2 = false;
	
	this.svg = d3.select('#' + this.parametres.selectorID).append('svg')
		.attr("width", this.parametres.width)
		.attr("height", this.parametres.height)
		.on("mousedown", function() {object.mouseDown(event);})
		.on("mousemove", function() {object.mouseMove(event);})
		.on("mouseup", function() {object.mouseUp(event);});
		
	paper.setup(this.canvas);
	paper.view.viewSize = new paper.Size(object.parametres.width, object.parametres.height);
	
	this.clusters = articles.clusters;
		
	//g√©n√©ration d'une palette de couleurs
	if (null == this.parametres.couleurs) {
		this.parametres.couleurs = this.selectColors(this.clusters.length);
	}
	
	console.log("Environnement OK.");
	
	//initialisation du Force Directed Graph
	
	this.data = {};
	this.zones = [];	
	
	if (this.parametres.isPositions) {
		this.data.nodes = this.generateNodes(articles, this.parametres.isPositions);
		this.length = articles.nbItems;
		this.display();
		
	}
	else {
		this.data.nodes = this.generateNodes(articles, this.parametres.isPositions);
		this.data.links = this.generateLinks(links, this.data.nodes);
	
		this.force = d3.layout.force()
			.charge(this.parametres.charge)    //-20  
			.nodes(this.data.nodes)
			.links(this.data.links)
			.linkDistance(function(link) {return link.linkDistance;}) //20
			.linkStrength(function(link) {return link.linkStrength;})
			.size([this.parametres.width, this.parametres.height])
			.gravity(this.parametres.gravity) //.1
			.theta(this.parametres.theta)
			.start();
			
		console.log("Graphe en cours de stabilisation . . .");
		
		this.force.on("tick", function() {
			console.log("Stabilisation OK.");
			object.display();
		});
	
	}	
};	


		
Carte.prototype = {
	
	//gestion des param√®tres
	etendre: function(parametres) {
		if (null==parametres || "object"!=typeof(parametres)) {
			return;
		}
		
		for (var cle in parametres) {
			this.parametres[cle] = parametres[cle];
		}
	},
	
	display: function () {
		
		this.showNodes();
		
		if (this.parametres.activerZoom) {
			this.activateZoom();
		}
		
		paper.setup(this.canvas);
		paper.view.viewSize = new paper.Size(this.parametres.width, this.parametres.height);
		this.createBackground();
	},
	
	activateZoom: function() {
		this.rect = this.svg.selectAll("rect")
		    .data([{
		    	x: this.parametres.width*(1 - this.parametres.scaleInterval[0])/(this.parametres.scaleInterval[1] - this.parametres.scaleInterval[0]),
		    	y: 0
		    }])
			.enter().append("rect")
			.attr("x", function(d) { return d.x; })
			.attr("y", function(d) { return d.y; })
		    .attr("width", 15)
		    .attr("height", 15)
		    .style("stroke", "black")
		    .style("fill", "#00f")
		    .style("z-index", 2)
			.call(this.drag);
	},
	
	//g√©n√©ration d'une palette de couleurs
	selectColors: function(nbClusters) {
		var colors = colorbrewer;
		var sets = ["BrBG", "PiYG", "PRGn", "PuOr", "RdBu", "RdYlBu", "RdYlGn"];
		var selectorID, finalColors = [];
		
		while (finalColors.length < nbClusters) {
			selectorID = 	Math.floor(Math.random()*7);
			selectorID2 = Math.floor(Math.random()*11);
			color = new paper.RgbColor(colors[sets[selectorID]][11][selectorID2]);
			
			var available = true;
			for (var i = 0; i < finalColors.length; i++) {
				if (Math.floor(finalColors[i].hue) == Math.floor(color.hue)) {
					available = false;
				}
			}
			
			if (color.brightness < 0.9 && available) {
				finalColors.push(color.toCssString());
			}
		}
		
		return finalColors;
	},
	
	//g√©n√©ration des noeuds √† partir du json
	generateNodes: function(items, isPos) {
		
		var nodes = [];
		var poidsMin = 100000, poidsMax = 0;
		
		// on cr√©e les noeuds
		for (var i = 0 ; i<items.nbItems; ++i) {
			nodes.push({index: i, titre: "Titre numero " + i, weigth: 1});
		}
		
		// on donne √† chaque noeud son poids et couleurs
		// on traite identiquement core et agregated
		// pour les clusters
		var nbClusters = items.clusters.length;
		for (var i =0; i< nbClusters; ++i) {
			var cluster = items.clusters[i], 
				clusterId = cluster.id,
				groups = [];
			if (cluster.items) {
				groups.push("items");
			}
			else {
				groups.push("core");
				groups.push("agregated");
			}
			for (var a in groups) {
				var group = cluster[groups[a]];
				for (var j =0; j<group.length; ++j) {
					var item = group[j], poids = parseInt(item.value);
					nodes[item.key]["poids"] = poids;
					nodes[item.key]["scaledPoids"] = poids;
					nodes[item.key]["group"] = clusterId;
					if (isPos) {
						nodes[item.key]["x"] = parseFloat(item.x);
						nodes[item.key]["y"] = parseFloat(item.y);
					}
					else {
						nodes[item.key]["x"] = this.parametres.width/2*(1 + Math.cos(i*Math.Pi/nbClusters));
						nodes[item.key]["y"] = this.parametres.height/2*(1 + Math.sin(i*Math.Pi/nbClusters));
					}
					if (null != this.parametres.relations) {
						this.parametres.relations.add(this.parametres.selectorID + ".node." + item.key, nodes[item.key]);
					}
					if (poids>poidsMax) {
						poidsMax = poids;
					}
					else if (poids<poidsMin) {
						poidsMin = poids;
					}
				}
			}
		}
		
		this.poidsMin = poidsMin;
		this.poidsMax = poidsMax;
		
		// pour les unclustered
		var unclusteredId = items.clusters.length;
		var unclusteredItems = (items.unclustered.items)? 
				items.unclustered.items: items.unclustered;
		for (var i =0; i< unclusteredItems.length; ++i) {
			var item = unclusteredItems[i];
			nodes[item.key]["poids"] = poidsMin;
			nodes[item.key]["scaledPoids"] = poids;
			nodes[item.key]["group"] = unclusteredId;
			if (isPos) {
				nodes[item.key]["x"] = parseFloat(item.x);
				nodes[item.key]["y"] = parseFloat(item.y);
			}
			else {
				nodes[item.key]["x"] = this.parametres.width/2;
				nodes[item.key]["y"] = this.parametres.height/2;
			}
		}
		
		console.log("Data articles extraites.");
		return nodes;
	},
	
	//g√©n√©ration des liens √† partir du json
	generateLinks: function(liens, nodes) {
		//var linkMax = 0, linkMin = 500;
		var links = [];
		
		for (var i = 0; i< liens.images.length; ++i) {
			var item = liens.images[i];
			for (var j = 0; j < 20 && j < item.v.length; ++j) {
				var voisin = item.v[j];
				
				var linkDistance = 200/Math.max(voisin.d, 4), linkStrength;
				
				if (nodes[item.id]["group"] == nodes[voisin.id]["group"]) {
					linkStrength = 1;
					linkDistance *= 0.5;
				}
				else {
					linkStrength = 0.5;
				}
				
				links.push({source: item.id, target: voisin.id, value: voisin.d, linkDistance: linkDistance, linkStrength: linkStrength});
			}
		}
		
		console.log("Data liens extraites.");
		return links;
	},

	//calcul du rayon
	radius: function(poids) {
		
		var diff = this.parametres.nodeSizeInterval[1] - this.parametres.nodeSizeInterval[0];
		scale = this.getScale(this.rect);
		
		if (this.parametres.log) {
			return this.parametres.nodeSizeInterval[0] + Math.log(poids/(this.poidsMin*scale))*diff/Math.log(this.poidsMax/this.poidsMin);
			
		}
		else if (this.parametres.exp) {
			return this.parametres.nodeSizeInterval[0]*Math.exp(Math.log(this.parametres.nodeSizeInterval[1]/this.parametres.nodeSizeInterval[0])*(poids-(this.poidsMin*scale))/(scale*(this.poidsMax - this.poidsMin)));
		}
		else {
			return scale*((this.parametres.nodeSizeInterval[0] + diff*(poids - scale*this.poidsMin)/(scale*(this.poidsMax - this.poidsMin))));
		}
	},
	
	//affichages des noeuds
	showNodes: function() {
		var object = this;
		node = this.svg.selectAll("circle.node")
			 .data(this.data.nodes)
			 .enter().append("circle")
			 .attr("class", "node")
			 .attr("cx", function(d) { return d.x; })
			 .attr("cy", function(d) { return d.y; })
			 .attr("z-index", 0)
			 .attr("r", function(d) {return object.radius(d.poids);})
			 .style("fill", function(d) { return object.parametres.couleurs[d.group]; })
			 .on("mouseover", this.nodeMouseover)
			 .on("mouseout", this.nodeMouseout);
	
		node.append("p")
			 .text(function(d) { return d.titre; });
		node.on('click', this.nodeClick);
		console.log("Noeuds OK.");
	},
	
	//g√©n√©ration du fond de la carte
	createBackground: function() {
		var circlePaths = [];
		scale = this.getScale(this.rect);
		object = this;
		
		this.svg.selectAll('circle.node').each(function(d) {
			var node = d3.select(this);
			var circle = new paper.Path.Circle(
					new paper.Point(d.x, d.y), object.radius(d.scaledPoids)*2);
			circle.fillColor = node.style("fill");
			circlePaths.push(circle);
		});
		
		console.log("Fond des noeuds OK.");
		this.generateConnections(circlePaths);
		paper.view.draw();
		
		
		/*var endDate = new Date();
		var timer = endDate.getTime() - beginDate.getTime();
		console.log(timer);*/
	},
	
	//generate background connections between nodes of a same cluster
	generateConnections: function(paths) {
		for (var c=0; c<this.clusters.length; ++c) {
			var cluster = this.clusters[c];
			
			// d√©finir les donn√©es suivant le type pass√©
			var group = cluster.items;
			if (undefined==group) {
				group = cluster.core.concat(cluster.agregated);
			}
				
			var layer = new paper.Layer();
			
			// Donner un design au fond
			for (var attr in this.parametres.layerStyle) {
				if (layer[attr]) {
					layer[attr] = this.parametres.layerStyle[attr];
				}
				else {
					layer.style[attr] = this.parametres.layerStyle[attr];
				}
			}
			
			var maxDistance = this.scale(this.rect[0][0].getAttribute("x"))*this.parametres.maxDistance,
				handle = this.parametres.handle_len_rate;
			for (var i = 1; i<group.length; ++i) {
				var circle = paths[group[i].key];
				if ((circle.position.x + maxDistance > 0) && (circle.position.x < this.parametres.width + maxDistance) && (circle.position.y + maxDistance > 0) && (circle.position.y < this.parametres.height + maxDistance)) {
					layer.appendTop(circle);
					for (var j = 0; j<i; ++j) {
						var path = null;
						var path = this.connect(circle, paths[group[j].key], 0.5, handle, maxDistance);
						if (null!=path) {
							layer.appendTop(path);
						}
					}
				}
			}
			
			this.zones[c] = layer;
			if (null != this.parametres.relations) {
				this.parametres.relations.add(this.parametres.selectorID + ".layer." + c, layer);
			}
			
		}
		paper.project.layers[0].remove();
		console.log("Connexions OK.");
	},
	
	/*
	 * Create a connection between two balls
	 */
	connect: function(ball1, ball2, v, handle_len_rate, maxDistance) {
	    var center1 = ball1.position;
	    var center2 = ball2.position;
	    var radius1 = ball1.bounds.width / 2;
	    var radius2 = ball2.bounds.width / 2;
	    var pi2 = Math.PI / 2;
	    var d = center1.getDistance(center2);
	    var u1, u2;
	
	    if (radius1 == 0 || radius2 == 0) {
	        return null;
		}
	
	    if (d > maxDistance || d <= Math.abs(radius1 - radius2)) {
	        return;
	    } else if (d < radius1 + radius2) { // case circles are overlapping
	        return null;
	    } else {
	        u1 = 0;
	        u2 = 0;
	    }
	    
	    var center3 = center2.clone();
	    center3.x = center2.x - center1.x;
	    center3.y = center2.y - center1.y;
	
	    var angle1 = center3.getAngleInRadians();
	    var angle2 = Math.acos((radius1 - radius2) / d);
	    var angle1a = angle1 + u1 + (angle2 - u1) * v;
	    var angle1b = angle1 - u1 - (angle2 - u1) * v;
	    var angle2a = angle1 + Math.PI - u2 - (Math.PI - u2 - angle2) * v;
	    var angle2b = angle1 - Math.PI + u2 + (Math.PI - u2 - angle2) * v;
	    var p1a = center1.add(this.getVector(angle1a, radius1));
	    var p1b = center1.add(this.getVector(angle1b, radius1));
	    var p2a = center2.add(this.getVector(angle2a, radius2));
	    var p2b = center2.add(this.getVector(angle2b, radius2));
	
	    // define handle length by the distance between
	    // both ends of the curve to draw
	    var totalRadius = (radius1 + radius2);
	    var p3a = p2a.clone();
	    p3a.x = p1a.x - p2a.x;
	    p3a.y = p1a.y - p2a.y;
	    var d2 = Math.min(v * handle_len_rate, p3a.length / totalRadius);
	
	    // case circles are overlapping:
	    d2 *= Math.min(1, d * 2 / (radius1 + radius2));
	
	    radius1 *= d2;
	    radius2 *= d2;
	
	    var path = new paper.Path([p1a, p2a, p2b, p1b]);
	    path.style = ball1.style;
	    path.closed = true;
	    var segments = path.segments;
	    segments[0].handleOut = this.getVector(angle1a - pi2, radius1);
	    segments[1].handleIn = this.getVector(angle2a + pi2, radius2);
	    segments[2].handleOut = this.getVector(angle2b - pi2, radius2);
	    segments[3].handleIn = this.getVector(angle1b + pi2, radius1);
	    return path;
	},
	
	// ------------------------------------------------
	getVector: function(radians, length) {
		var angle = radians * 180 / Math.PI;
	    return new paper.Point({"angle": angle,
	        "length": length
	    });
	},
	
	//apparition de l'infoBulle
	highlight: function(node) {
		scale = this.parametres.activerZoom ? this.scale(this.rect[0][0].getAttribute("x")) : 1;
		this.infoBulle.html(this.parametres.infobulleHtml(node));
		if (this.infoBulle.classed("selected")) {
			this.infoBulle.transition()
				.duration(500)
				.style("left", node.x + "px")
				.style("top", node.y + "px");
		}
		else {
			this.infoBulle.classed("selected", true)
				.style("left", node.x + "px")
				.style("top", node.y + "px")
				.transition()
				.duration(300)
				.style("opacity", 0.5);
		}
	},
	
	//disparition de l'infoBulle
	blur: function() {
		this.infoBulle.classed("selected", false)
			.transition()
			.duration(400)
			.style("opacity", 0);
		this.infoBulle.style("top", this.parametres.height);
	},
	
	//zoom sur un point
	grow: function(node, scale) {
		if (!this.static) {
				d3.select(node)
				.attr("z-index", 1)
				.transition()
				.duration(200)
				.attr("r", this.parametres.nodeSizeInterval[1]*scale);
		}
	},
	
	//d√©zoom sur un point
	shrink: function(radius, node) {
		if (!this.static) {
			d3.select(node)
			.transition()
			.duration(70)
			.attr("z-index", 0)
			.attr("r", radius);
		}
	
	},
	
	//r√©affichage du fond sur recadrage du navigateur
	onResize: function(event) {
		paper.view.draw();
		d3.select('#' + this.parametres.canvasID)
			.attr("width", d3.select('#' + this.parametres.selectorID).attr("width"))
			.attr("height", d3.select('#' + this.parametres.selectorID).attr("height"));
	},
	
	dragstart: function(d,i, object) {
    	object.rect.xi = object.scale(d3.event.x);
    	object.static = true;
    },
    
	dragmove: function(d, i) {
		d.x += d3.event.dx;
		d3.select(this).attr("x", d.x);
	},
	
	dragend: function(d, i, object) {
		
		ratio = object.scale(d3.event.x)/object.rect.xi;
		object.infoBulle.classed("selected", false)
			.style("opacity", 0);
			
		object.zoom(ratio);
		object.resetCanvas();
		
		object.zoomTransition(ratio);

		
		object.static = false;
		var timer = new Date().getTime() - object.beginDate.getTime();
		console.log(timer);
	},
	
	
	resetCanvas: function() {
		paper.view.remove();
		this.hideView();
		paper.setup(this.canvas);
		paper.view.viewSize = new paper.Size(this.parametres.width, this.parametres.height);
	},
	
	hideView: function() {
		var ctx = this.canvas.getContext('2d');
		ctx.fillStyle = 'rgb(0,0,0)';
		ctx.fillRect(this.canvas.left, this.canvas.top, this.canvas.width, this.canvas.height);
	},
	
	scale: function(x) {
		return (this.parametres.scaleInterval[0] + (this.parametres.scaleInterval[1] - this.parametres.scaleInterval[0])*(x/this.parametres.width));
	},
	
	getScale: function(rect) {
		if (rect == undefined || !this.parametres.activerZoom) {
			return 1;
		}
		else {
			if (this.parametres.zoomNode) {
				return this.scale(rect[0][0].getAttribute("x"));
			}
			else if (this.parametres.logZoomNode) {
				return Math.log(1 + this.scale(rect[0][0].getAttribute("x"))*this.parametres.logZoomNodeParameter)/(Math.log(1 + this.parametres.logZoomNodeParameter));
			}
			else {
				return 1;
			}
		}
	},

	
zoom: function(ratio) {
	
		object = this;
		
		scale = this.getScale(this.rect);
		
		this.svg.selectAll("circle.node")
			.each(function(d) {
				var distx = object.parametres.width/2- d.x;
				distx *= ratio;
				d.x = object.parametres.width/2 - distx;
				
				var disty = object.parametres.height/2 - d.y;
				disty *= ratio;
				d.y = object.parametres.height/2 - disty;
				d.scaledPoids = d.poids*scale;
				
			});
	},
	
	zoomTransition: function(ratio) {
		var object = this;
		var c = 0;
		this.svg.selectAll("circle.node")
			.transition()
				.duration(Math.max(400*ratio, 400/ratio))
				.attr("cx", function(d) {
					return d.x;
				})
				.attr("cy", function(d) {
					return d.y;
				})
				.attr("r", function(d) { return object.radius(d.scaledPoids);})
				.each("end", function() {
					c++;
					if (c == object.length) {
						object.static = false;
						object.createBackground();
					}
				});
	},
	
	mouseDown: function(e) {
		this.isDown = true;
		this.mouse.x = e.x;
		this.mouse.y = e.y;
		this.center = {};
		/*this.center.x = paper.view.center.x;
		this.center.y = paper.view.center.y;*/
		var object = this;
		setTimeout(function() {
			if (object.isDown) {
		    	object.blur();
		    	//d3.select(object.canvas).style("visibility", "hidden");
		    	object.resetCanvas();
		    	object.static = true;
		    	object.drag2 = true;
			}	
	    }, 100);
	},
	
	mouseMove: function(e) {
		if (this.drag2) {
			diff = {};
			diff.x = e.x - this.mouse.x;
			diff.y = e.y - this.mouse.y;
			/*this.center.x -= diff.x;
			this.center.y -= diff.y;*/
			this.svg.selectAll('circle.node')
				.attr("cx", function(d) {
					d.x += diff.x;
					return d.x;
					})
				.attr("cy", function(d) {
					d.y += diff.y;
					return d.y;
					});
			this.mouse.x = e.x; this.mouse.y = e.y;
		}
	},
	
	mouseUp: function(e) {
			if (this.drag2) {
				//paper.view.center = new paper.Point(this.center.x, this.center.y);
				//d3.select(object.canvas).style("visibility", "visible");
				this.createBackground();
				this.static = false;
				this.drag2 = false;
			}
			this.isDown = false;
			this.mouse = {};
		}
	
}