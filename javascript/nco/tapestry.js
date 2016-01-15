function glow() {
	document.getElementById('')
}


function Tapestry(json,parametres){
	this.parametres = {
			name: null,
			hauteur: 400,
			largeur: 900,	
			timelineHaute : "#timelinehaute",
			relations: null,
			contenu: function(cellule, element) {
				
				var html;
				var img = new Image();
				img.src= element.name;
				indexx = element.indexx;
				var wi, hi, wc, hc;
				
				wi = img.width;
				hi = img.height;
				wc = cellule.offsetWidth  ;
				hc = cellule.offsetHeight ;
			//	r = Math.min(hi/hc, wi/wc);
			//	w = wi/r;
			//	h = hi/r;
				
				var posx, posy;
				posx = (wi-wc)/2;
				posy = (hi-hc)/2;
				
				html = "<img class = 'img' src = \"" + img.src + "\" style=\" width:"+ wc + "px; height:" +hc + "px; margin-top: 0px; margin-left: 0px;\" />";
				html += "<p class = 'title' style = \" width:" + wc + "px;\"> Image "+String(indexx)+"</p>";
				
				return html;


			}};
		
	
		
	var object = this;

	
	//----------------------------------------------------------------------
	// FENETRE DE FOND
	
	object.tapestryHtml = d3.select("#timelinehaute")
	.style('position', 'relative')
	.style('width', object.parametres.largeur + 'px')
	.style('height', object.parametres.hauteur + 'px')
	.style('background-color', 'black');	
	//.style('overflow','hidden');
	
	object.boutonzoom = d3.select("#timelinebasse").append('div')
	.style('position', 'relative')
	.style('width', '200px')
	.style('height','20px')
	.style('background-color', 'grey')	
	.style('margin-top', '5px')
	.html("<p class = 'title' style = \" width:200px;\"> Dezoooooom </p>")
	.on('mouseover', function(){d3.select(this).style('opacity', 0.8);})
	.on('mouseout', function(){d3.select(this).style('opacity', 1);})
	.on('click',function(){object.agencerzoom;})
	
		
	//----------------------------------------------------------------------
	// CREATION DES PETITES FENETRES
	
	var listeposition = this.getPosition();
	var larg,haut;
	larg = String(this.parametres.largeur/5) + "px";
	larg2=String(this.parametres.largeur/10) + "px";
	haut = String(this.parametres.hauteur/2 -1) + "px" ;
	
	d3.select("#timelinehaute").selectAll("div")
		.data(donnees).enter().append("div")
			.attr('class', 'cell')
			.attr('id', function(index){
				if(index==0){return "first";}
				else if (index==10){return "last";}
			})
			
			.on('mouseover', function(){d3.select(this).style('opacity', 0.8);})
			.on('mouseout', function(){d3.select(this).style('opacity', 1);})
			.on('click',function(datum,index){object.agencerzoom(datum,index);})
			
			.style('position', 'absolute')
			.style('width', function(datum,index){
				if(index==0 || index==10){return larg2;}
				else{return larg;}
			})
			.style('height',haut)
			.style('background-color', '#32675F')
			.style('text-align','center')
			.html(function(datum,index){return object.parametres.contenu(this,datum);})
			.style('left', function(datum, index) {
				return listeposition[index][0];
			})
			.style('top', function(datum, index) {
				return listeposition[index][1];
			})
	//		.attr('onmouseover',"this.style(\"stroke\",\"white\");" )
			;
		
	
	
};
// Position des fenetres 
Tapestry.prototype = {		

		getPosition: function(){
			var l,h;
			l= this.parametres.largeur;
			h= this.parametres.hauteur;
			var listposition=[[0,0]];
			for (var i=0;i<9;i++){
				listposition.push([(i*0.5)*l/5,h/2*((i+1)%2)]);
			}
			listposition.push([4.5*l/5,0]);
			//for (var j=0;j<5;j++){
			//	listposition.push([j*l/5,h/2]);
			//}
			return listposition;
			

		},
			
		agencerzoom: function(element,indexx){
			var object = this;
			this.tapestryHtml.selectAll("div")
				.data(donnees[indexx].childs)
					.html(function(datum,index){return object.parametres.contenu(this,datum);});
			this.tapestryHtml.select("first")
				.data(donnees[indexx-1])
					.html(function(datum,index){return object.parametres.contenu(this,datum);});
		},
			
			
		agencerdezoom: function(){
			var object = this;
			this.tapestryHtml.selectAll("div")
			.data(donnees)
				.html(function(datum,index){return object.parametres.contenu(this,datum);});
			
		}
				
		
		
};


