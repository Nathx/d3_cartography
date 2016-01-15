/**
 * Creation of a treemap
 */

/**
 * Parameters is the object containing basics initialization parameters
 */
function Treemap(json, parametres) {
	this.parametres = {
		name: null,
		hauteur: 300,
		largeur: 500,
		selector: "#treemap",
		
		couleurs: null,
		relations: null,
		
		onFocus: null,
		onBlur: null,
		contenu: null,
		template: null,		
	
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
		this.parametres.onBlur = this.unfocus;
	}
	if (null==this.parametres.contenu) {
		if (null!=this.parametres.template) {
			this.template = $(this.parametres.template.selector);
			this.template.remove();
			this.parametres.contenu = this.renderContenu;
		}
		else {
			this.parametres.contenu = this.defaultContent;
		}
	}
	
	/* -- Initialisation d'attributs -- */
	var object = this;
	this.treemap = null;
	this.dataTreemap = null;
	this.articles = null;
	this.treemapHtml = null;

	this.dataJSON = json;	
	this.dataTreemap = this.getDataTreemap(json);
	this.articles = this.dataJSON.articles[0];
	
	this.duree = this.dataJSON.clusters[0].length;
	this.nbClusters = this.dataJSON.clusters.lenght;
	this.nbArticles = this.articles.length;
	
	/* -- Create the treemap -- */
	
	if (null==this.parametres.couleurs) {
		this.parametres.couleurs = d3.scale.category20c();
	}
	
	this.treemap = d3.layout.treemap()
		.size([this.parametres.largeur, this.parametres.hauteur])
		.sticky(true)
		.value(function(d) { 
			return object.comptage(d); 
		});
		
	this.treemapHtml = d3.select("#treemap").append('div')
		.style('position', 'relative')
		.style('width', this.parametres.largeur + 'px')
		.style('height', this.parametres.hauteur + 'px')
		.style('background-color', '#32375F');
		
	this.treemapHtml.data(this.dataTreemap).selectAll("div")
		.data(this.treemap.nodes).enter().append("div")
			.attr('class', 'cell')
			.style('background-color', function(datum) {
				return d.children? null: object.parametres.couleurs(datum.id);
			})
			.call(this.sizeCell)
			.html(function(d) { 
				return d.children? null: object.getContent(d); 
			})
			.attr("datetime", function(d) {
				return d.children? 0: object.articles[d.idMax].date;
			});
		
	if (null!=this.parametres.relations) {
		this.parametres.relations.add(this.parametres.name, this);
		
		this.treemapHtml.selectAll("div")
			.each(function(datum) {
				var item = d3.select(this);
				object.parametres.relations.add(
					object.parametres.name +'.'+ datum.name, item);
			});
	}
};

Treemap.prototype = {
	etendre: function(parametres) {
		if (null==parametres || "object"!=typeof(parametres)) {
			return;
		}
		
		for (var cle in parametres) {
			this.parametres[cle] = parametres[cle];
		}
	},
	
	// calcule la taille d'un cluster (somme de tout les articles)
	// et l'élément de poids maximal
	comptage : function(datumCell, start, end) {
		var compteursize = 0, idMax = 0, poidsMax = 0;
		var timeline = datumCell.timeline;
		
		var tStart = (start==null || start<0)? 0: start;
		var tEnd = (end==null || end>timeline.length)? 
				timeline.length: end;
		var index, endIndex, articleId;
		for (t=tStart; t<tEnd; t++) { //boucle sur les t de la timeline
			compteursize+= timeline[t].length;
			for (index = 0, endIndex = timeline[t].length; 
				index < endIndex; ++index) {
				articleId = timeline[t][index];
				if (this.articles[articleId].poids > poidsMax) {
					poidsMax = this.articles[articleId].poids;
					idMax = articleId;
				}
			}
		}
		
		datumCell.poidsMax = poidsMax;
		datumCell.idMax = idMax;
		return compteursize;
	},
	
	getContent: function(datumCell, start, end) {
		if (null!=this.parametres.contenu) {
			return this.parametres.contenu.call(
				this, datumCell, this.articles[datumCell.idMax]);
		}
		else {
			return this.articles[datumCell.idMax].titre;
		}
	},

	getDataTreemap : function(json, start, end) {
		var data = { name : "data", children : []};
		var clusters = json.clusters;
		
		for (var i=0, _end=clusters.length; i<_end; i++) { // parcours les differents clusters
			var cluster = { id: clusters[i].numero, name : "cluster." + clusters[i].numero, timeline : clusters[i].timeline };
			data.children.push(cluster);
		}
		
		return [data];
	},

	sizeCell: function() {
		this.style("left", function(d) { return d.x + "px"; })
			.style("top", function(d) { return d.y + "px"; })
			.style("width", function(d) { return d.dx - 1 + "px"; })
			.style("height", function(d) { return d.dy - 1 + "px"; });
	},

	bindMapToStream: function(stream, map) {
		var object = this;
		if (null!=this.parametres.onFocus && null!=this.parametres.onBlur) {
			stream.on("mouseover", function() {
				object.parametres.onFocus(stream, map);
			});
			stream.on("mouseout", function() {
				object.parametres.onBlur(stream, map);
			});
		}
	},

	bindStreamToMap: function(map, stream) {
		var object = this;
		if (null!=this.parametres.onFocus && null!=this.parametres.onBlur) {
			map.on("mouseover", function() {
				object.parametres.onFocus(stream, map);
			});
			map.on("mouseout", function() {
				object.parametres.onBlur(stream, map);
			});
		}
	},
	
	focus: function(map) {
		map.classed("selected", true)
			.transition()
			.duration(150)
			.delay(50)
			.style("opacity", 0.5);
	},
	
	unfocus: function(map) {
		map.classed("selected", false)
			.transition()
			.duration(100)
			.delay(50)
			.style("opacity", 1);
	},
	
	transition: function(start, end) {
		var object = this;
		// To avoid conflicts while elements are hovered, lock the actions
		var locked;
		if (this.parametres.relations) {
			locked = this.parametres.relations.lock("selectionResize");
		}
		
		this.treemapHtml.selectAll("div")
			.data(this.treemap.value(function(d) {
				return object.comptage(d, start, end); 
			}))
			.attr("datetime", function(d) {
				return d.children? 0: object.articles[d.idMax].date;
			})
			.html(function(d) { return d.children? null: object.getContent(d, start, end); })
			.transition()
				.duration(this.parametres.transitionDuration)
				.call(this.sizeCell)
				// Free the lock
				.each("end", function() { 
					if (locked) {
						object.parametres.relations.unlock("selectionResize");
					}
				});
	},
	
	defaultContent: function(cellule, article) {
		var html;
		var img = article.image;
		var wi, hi, wc, hc, w, h, r;
		
		wi = img.largeur;
		hi = img.hauteur;
		wc = cellule.dx - 1;
		hc = cellule.dy - 1;
		r = Math.min(hi/hc, wi/wc);
		w = wi/r;
		h = hi/r;
		
		var posx, posy;
		posx = -(w-wc)/2;
		posy = -(h-hc)/2;
		
		html = "<img class = 'img' src = \"" + img.url + "\" style=\" width:"+ w + "px; height:" +h + "px; margin-top:" + posy + "px; margin-left:" + posx + "px;\" />";
		html += "<p class = 'title' style = \" width:" + wc + "px;\" >" + article.titre + "</p>";
		
		return html;
	},
	
	renderContenu: function(cellule, article) {
		var image = article.image;
		
		var wi = image.largeur,
			hi = image.hauteur,
			wc = cellule.dx - 1,
			hc = cellule.dy - 1,
			r = Math.min(hi/hc, wi/wc),
			w = wi/r,
			h = hi/r,
			posx = -(w-wc)/2,
			posy = -(h-hc)/2;
		
		var data = {
			'urlImage': image.url,
			'widhtImage': w +"px",
			'heightImage': h +"px",
			'cssOffsetImage': "margin-top: "+ posy +"px; margin-left: "+posx +"px;",
			'titreArticle': article.titre,
			'dateArticle': article.date,
			'widthArticle': wc +"px",
			'heightArticle': hc +"px",
			'cssWidthArticle': "width:" +wc +"px;",
			'cssHeightArticle': "height:" +hc +"px;",
			'cssDimensionsArticle': "width:" +wc +"px;height:" +hc +"px;"
		};
		
		return this.template
			.render(data, this.parametres.template.directives).html();
	},
	
	on: function(event, action) {
		switch(event) {
		default:
			this.treemapHtml.on(event, action);
		}
	}
};
