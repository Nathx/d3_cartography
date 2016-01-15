/**
 * Streamgraph
 * 
 * Faut-il remettre la grille pour que le curseur puisse y coller
 * Faut-il un template html pour la timeline? 
 */

function Streamgraph(json, parametres) {
	this.parametres = {
		name: null,
		hauteur: 400,
		largeur: 900,
		selector: "#streamgraph",
		
		couleurs: null,
		relations: null,
		activerSelection: false,
		activerCurseur: false,
		activerTimeline: false,
		
		onFocus: null,
		onBlur: null,	
	
		transitionDuration: 1000
	};
	
	this.etendre(parametres);
	
	/* -- Gestion des valeurs par défaut -- */
	if (null==this.parametres.name) {
		this.parametres.name = this.parametres.selector;
	}
	if (null==this.parametres.onFocus) {
		this.parametres.onFocus = this.focus;
	}
	if (null==this.parametres.onBlur) {
		this.parametres.onBlur = this.blur;
	}
	
	/* -- Initialisation d'attributs -- */
	var object = this;
	this.streamgraph = null;
	this.visuel = null;
	
	this.area = d3.svg.area()
		.x(function(d) { 
			return d.x * object.parametres.largeur / object.mx; 
		})
		.y0(function(d) { 
			return object.parametres.hauteur 
				- d.y0 * object.parametres.hauteur / object.my; 
		})
		.y1(function(d) { 
			return object.parametres.hauteur
				- (d.y + d.y0) * object.parametres.hauteur / object.my;
		});
	

	this.dataJSON = json;	
	this.dataStreamgraph = this.getDataStreamgraph(this.dataJSON);
	
	this.duree = this.dataStreamgraph[0].length;
	this.nbClusters = this.dataStreamgraph.length;
	
	if (null==this.parametres.couleurs) {
		this.parametres.couleurs = d3.scale.category20c();
	}

	this.pas =  this.parametres.largeur/this.duree;
	this.mx = this.dataStreamgraph[0].length - 1;
	this.my = d3.max(this.dataStreamgraph, function(d) {
		  return d3.max(d, function(d) {
		    return d.y0 + d.y;
		  });
		});
	
	/* -- Create the streamgraph -- */
	
	/* -- Création des éléments HTML -- */
	
		/* -- Création des barres de sélection -- */
	if (this.parametres.activerSelection) {
		$(this.parametres.selector)
			.prepend("<div class='cache gauche'></div>")
			.prepend("<div class='cache droite'></div>")
			.prepend("<div class='selecteur gauche'></div>")
			.prepend("<div class='selection'></div>")
			.prepend("<div class='selecteur droite'></div>");
		
		// Sélecteurs latéraux
		this.selecteurGauche = $(this.parametres.selector + ' .selecteur.gauche');
		this.selecteurDroit = $(this.parametres.selector + ' .selecteur.droite');
		this.selection = $(this.parametres.selector + ' .selection');		
		this.cacheDroit = $(this.parametres.selector + ' .cache.droite');
		this.cacheGauche = $(this.parametres.selector + ' .cache.gauche');
	}
	
		/* -- Création d'un curseur -- */
	if (this.parametres.activerCurseur) {
		this.curseur = d3.select(this.parametres.selector)
			.append("div").classed("curseur", true);
	}
	
		/* -- Création de l'élément streamgraph -- */
	this.visuel = d3.select(this.parametres.selector)
		.style("width", this.parametres.largeur + "px")
		.style("height", this.parametres.hauteur + "px")
		.append("svg:svg");
	
	this.visuel.selectAll("path")
		.data(this.dataStreamgraph).enter().append("svg:path")
			.style("fill", function(datum, index) {
				return object.parametres.couleurs(index); 
			})
			.attr("d", this.area);
	
	if (null!=this.parametres.relations) {
		this.parametres.relations.add(this.parametres.name, this);
		
		this.visuel.selectAll("path")
			.each(function(datum, index) { 
				var item = d3.select(this).attr("id", index);
				object.parametres.relations.add(
					object.parametres.name +'.cluster.'+ index, item);
			});
	}
	
		/* -- Création d'une timeline -- */
	if (this.parametres.activerTimeline) {
		this.timeline = d3.select(this.parametres.selector)
			.append("div").classed("timeline", true);
		this.generateTimeline();
	}
	
	/* -- Configuration des barres de sélection -- */
	if (this.parametres.activerSelection) {		
		// Sélecteur gauche
		this.selecteurGauche.draggable({
			axis : 'x',
			cursor: "move",
			containment: [0, 0,
			    this.parametres.largeur - parseInt(this.selecteurDroit.css("width")), 
			    this.parametres.hauteur],
			drag: function() { object.followSelecteur(object.parametres.selector, object.parametres.largeur); },
			stop: function(e, ui){
				object.calculerPositions();
				object.followSelecteur(object.parametres.selector, object.parametres.largeur);	
				object.contain(object.parametres.selector, object.parametres.largeur	);
				if (undefined!=object.__onselectionResize) {
					object.__onselectionResize(
						object.positionsBarres[0], object.positionsBarres[1]);
				}
			}
		});
		
		// Sélecteur droit
		this.selecteurDroit.draggable({
			axis : 'x',
			cursor: "move",
			containment: [0, 0,
			    this.parametres.largeur - parseInt(this.selecteurDroit.css("width")), 
			    this.parametres.hauteur],
			drag: function() { object.followSelecteur(object.parametres.selector, object.parametres.largeur); },
			stop: function(e, ui){
				object.calculerPositions();
				object.followSelecteur(object.parametres.selector, object.parametres.largeur);	
				object.contain(object.parametres.selector, object.parametres.largeur	);
				if (undefined!=object.__onselectionResize) {
					object.__onselectionResize(
						object.positionsBarres[0], object.positionsBarres[1]);
				}
			}
		});
		
		// Barre de déplacement de la sélection
		this.selection.draggable({
			axis : 'x',
			cursor: "move",
			containment: [
			    parseInt(this.selecteurGauche.css("width")), 
			    0,
			    this.parametres.largeur - parseInt(this.selecteurDroit.css("width")), 
			    this.parametres.hauteur],
			drag: function() { object.followSelection(object.parametres.selector, object.parametres.largeur); },
			stop: function(e, ui) {
				object.followSelection(object.parametres.selector, object.parametres.largeur);
				object.calculerPositions();	
				object.contain(object.parametres.selector, object.parametres.largeur);
				if (undefined!=object.__onselectionResize) {			
					object.__onselectionResize(
						object.positionsBarres[0], object.positionsBarres[1]);
				}
			}
		});
		
		/* -- Placement initial des éléments -- */
		this.selecteurGauche.css("left", "0px");
		this.selecteurDroit.css("left", this.parametres.largeur - parseInt(this.selecteurDroit.css("width")) + "px");
		this.cacheGauche.css({"left": "0px", "width": "0px"});
		this.cacheDroit.css({"left": this.largeur + "px", "width": "0px"});
		
		this.positionsBarres = [0, this.duree];
	}
	
	/* -- Configuration du curseur -- */
	if (this.parametres.activerCurseur) {
		if (undefined!=this.parametres.relations) {
			this.parametres.relations.add(this.parametres.name + "curseur");
		}
	}
};

Streamgraph.prototype = {
	etendre: function(parametres) {
		if (null==parametres || "object"!=typeof(parametres)) {
			return;
		}
		
		for (var cle in parametres) {
			this.parametres[cle] = parametres[cle];
		}
	},

	getDataStreamgraph : function(clusters) {
		var data = new Array(),
			duree = clusters[0].timeline.length;
		
		var dataCluster, timeline;
		for (var i=0, end=clusters.length; i<end; i++) {
			timeline = clusters[i].timeline;
			dataCluster = [];
			
			for (var t=0; t<duree; t++) {
				dataCluster.push({ x: t, y: timeline[t].length });
			}
			data.push(dataCluster);
		}
		
		// Smooth the data
		
		// Compute the wiggle for stacks
		return d3.layout.stack().offset("wiggle")(data);
	},
	
	focus: function(stream) {
		stream.style("stroke", "black")
				.transition()
				.duration(300)
				.delay(50)
				.style("opacity", 0.5);
	},
	
	blur: function(stream) {
		stream.style("stroke", "none")
				.transition()
				.duration(300)
				.delay(75)
				.style("opacity", 1);
	},
	
	calculerPositions: function() { //recalcul des valeurs
		this.positionsBarres[0] = Math.round(
			parseInt(this.selecteurGauche.css("left"))
			/this.pas
		);
		this.positionsBarres[1] = Math.round(
			(parseInt(this.selecteurDroit.css('left')) 
				+ parseInt(this.selecteurDroit.css('width')))
			/this.pas
		);
	},
	
	//déplacement des caches avec le drag'n'drop
	followSelecteur: function(selector, largeur, gauche) {
		this.cacheGauche.css("width", this.selecteurGauche.css("left"));
		
		this.cacheDroit
			.css("left", parseInt(this.selecteurDroit.css("left")) 
					+ parseInt(this.selecteurDroit.css("width")) + "px")
			.css("width", largeur - parseInt(this.cacheDroit.css('left')) + "px");
		
		this.selection
			.css("left", parseInt(this.selecteurGauche.css("left")) 
					+ parseInt(this.selecteurGauche.css("width")) + "px"
			)
			.css("width", parseInt(this.selecteurDroit.css("left")) 
					- parseInt(this.selecteurGauche.css("left"))
					- parseInt(this.selecteurGauche.css("width"))
					+ "px"
			);
	},
	
	followSelection: function(selector, largeur) {		
		var positionSelection = parseInt(this.selection.css("left")),
			largeurSelection =  parseInt(this.selection.css("width")),
			object = this;
		
		this.selecteurGauche.css("left", 
			positionSelection - parseInt(object.selecteurGauche.css("width")) + "px"
		);
		
		d3.select(selector + ' div.cache.gauche').style("width", function() {
			return parseInt(object.selecteurGauche.css("left")) + "px";
		});
		
		this.selecteurDroit.css("left", 
			positionSelection + largeurSelection + "px"
		);
		
		d3.select(selector + ' div.cache.droite')
			.style("left", positionSelection + largeurSelection 
					+ parseInt(object.selecteurDroit.css("width")) + "px")
			.style("width", largeur - (positionSelection + largeurSelection 
						+ parseInt(object.selecteurDroit.css("width"))) + "px");
	},
	
	
	contain: function(selector, largeur) {
		var separation = 2*this.pas - parseInt(this.selecteurDroit.css("width"));
		if (separation <0) {
			separation = 0;
		}
		
		//limite pour gauche
		var ar = this.selecteurGauche.draggable("option", "containment");
		ar[2] = parseInt(this.selecteurDroit.css("left")) - separation;
	
		//limite pour droite
		ar = this.selecteurDroit.draggable("option", "containment");
		ar[0] = parseInt(this.selecteurGauche.css("left")) + separation;
		
		// Limites de la selection
		ar = this.selection.draggable("option", "containment");
		ar[2] = largeur - parseInt(this.selection.css("width")) 
			- parseInt(this.selecteurDroit.css("width"));
	},	
	
	resize: function(start, end) {
		var data = new Array(),
			clusters = this.dataJSON;

		var dataCluster, timeline;
		for (var i=0, _end=clusters.length; i<_end; i++) {
			timeline = clusters[i].timeline;
			dataCluster = [];
			var compteur = 0;

			for (var t=start; t<end; t++) {
				dataCluster.push({ x: compteur, y: timeline[t].length });
				compteur++;
			}
			data.push(dataCluster);
		}
		
		this.dataStreamgraph = d3.layout.stack().offset("wiggle")(data);
		
		this.mx = this.dataStreamgraph[0].length - 1;
		this.my = d3.max(this.dataStreamgraph, function(d) {
			  return d3.max(d, function(d) {
			    return d.y0 + d.y;
			  });
			});
		
		this.visuel.selectAll("path")
			.data(this.dataStreamgraph)
			.transition()
				.duration(this.parametres.transitionDuration)
				.attr("d", this.area);
	},
	
	showCursor: function() {
		this.curseur.style("visibility", "visible");
	},
	
	hideCursor: function() {
		this.curseur.style("visibility", "hidden");
	},
	
	placerCurseur: function(position, mode) {
		switch(mode) {
		case "index":
			if (position > this.duree) {
				position = this.duree;
			}
			else if (position < 0) {
				position = 0;
			}
			
			this.curseur.style("left", position*this.pas + "px");
			break;
			
		case "distance":
		default:
			if (position>this.parametres.largeur) {
				position = this.parametres.largeur;
			}
			else if (position<0) {
				position = 0;
			}
		
			this.curseur.style("left", position + "px");
		}
	},
	
	generateTimeline: function() {
		var dateInitiale = 0,
			dateFinale = this.duree,
			pas = 5;
		for (var t = dateInitiale; t<dateFinale; t+=pas) {
			this.timeline.append("p").classed("time-unit", true).
				html("date " + t + "-" + (t+pas > dateFinale? dateFinale: t+pas-1));
		}
	},
	
	on: function(event, action) {
		switch(event) {
		case "selectionResize":
			this["__on" + event] = function() {
				try {
					action.apply(this, arguments);
				}
				finally {}
			};
			break;
			
		default:
			this.visuel.on(event, action);
		}
	}
};
