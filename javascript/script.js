
//On crée l'outil Relations préalablement
var r = new Relations();
var links = {};

var parametresCarto = {
	width: 1140,
	height: 900,
	isPositions: true,
	nodeSizeInterval: [2, 20],
	scaleInterval: [0.5, 15],
	//exp: true,
	exp: false,
	relations: r,
	maxDistance: 50,
	theta: 1.6,
	gravity: .17,
	charge: -40,
	logZoomNode: true,
	logZoomNodeParameter: 4
	};
	

var carto = new Carte(parametresCarto, articlesCCA2, links);

/*
var parametresStreamgraph = {
	name: "streamgraph",
	hauteur: 300,
	relations: r
};
var streamgraph = new Streamgraph(json, parametresStreamgraph);
//*/

/*
var parametresTreemap = {
	name: "treemap",
	hauteur: 300,
	relations: r
};
var treemap = new Treemap(json, parametresTreemap);
//*/

/*
r.add("st", streamgraph);
r.add("tr", treemap).bindTo("selectionResize", "st", 
		function(objet, params) { objet.transition(params[0], params[1]); });

for (var i = 0; i<10; ++i) {
	r.get("treemap.cluster." + i)
		.mouseover(treemap.parametres.onFocus)
		.mouseout(treemap.parametres.onBlur)
		.mouseover("streamgraph.cluster." + i, streamgraph.parametres.onFocus)
		.mouseout("streamgraph.cluster." + i, streamgraph.parametres.onBlur);
	r.get("streamgraph.cluster." + i)
		.mouseover(streamgraph.parametres.onFocus)
		.mouseout(streamgraph.parametres.onBlur)
		.mouseover("treemap.cluster." + i, treemap.parametres.onFocus)
		.mouseout("treemap.cluster." + i, treemap.parametres.onBlur);
}
//*/