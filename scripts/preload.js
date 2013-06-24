///////////////////////////////////////////////////
//   Preloads neccessary files                   //
///////////////////////////////////////////////////
///////////////////////////////////////////////////

var SWEEPER=SWEEPER || {}; //prevents errors if scripts loaded out of order
SWEEPER.preload=(function($S,document){
	var font=function(font_name){
		var el=document.createElement("div");
		el.style.fontFamily=font_name;
		el.style.color="#195DE5";
		el.style.innerHTML=".";
		document.getElementsByTagName('body')[0].appendChild(el);
	}
	var image=function(img_loc){
		var img = new Image();
		img.src = img_loc;
		return img;
	}
	
	return {
		font:font,
		image:image
	}
}(SWEEPER,document));