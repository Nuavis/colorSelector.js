var colorSelector = function(x,y,size,callback){
	this.x = x;
	this.y = y;
	this.mdOnSideBar = false;
	this.mdOnBlock = false;
	this.size = size;
	this.selectedColor = 0xFF0000;
	this.selectedColorX = 1;
	this.selectedColorY = 0;
	this.baseColor = 0xFF0000;
	this.baseColorRed = (this.baseColor & 0xFF0000)>>16;
	this.baseColorGreen = (this.baseColor & 0x00FF00)>>8;
	this.baseColorBlue = this.baseColor & 0x0000FF;
	var can = document.createElement("canvas");
	can.width = size;
	can.height = size;
	can.onselectstart = function(){return false;};
	document.body.appendChild(can);
	can.className = "colorSelector";
	this.can = can;
	this.con = can.getContext("2d");
	can.style.position = 'absolute';
	can.style.border = 'solid 1px #ccc';
	can.style.padding = '10px';
	can.style.borderRadius = '5px';
	can.style.left = x + 'px';
	can.style.top = y + 'px';
	this.text = document.createElement("input");
	this.text.type = 'text';
	this.text.style.position = 'absolute';
	this.text.style.width = size/2 + 'px';
	this.text.style.font = "'Arial' 18px";
	this.text.style.left = x+size/7.5*2 + "px";
	this.text.style.top = y+size-18 + "px";
	document.body.appendChild(this.text);
	this.rendercolorSelector();
	var cw = this;
	var mdFunc = function(e){
		e.preventDefault();
		e.stopPropagation();
		var mx = e.pageX - cw.x - 10,my = e.pageY - cw.y - 10;//MouseX and MouseY relative to the canvas, then shifting 10 so the padding isn't a problem
		if (mx > size - size/10){
			cw.mdOnSideBar = true;
		}else if (mx<size-size/7.5 && my<size-size/7.5){
			cw.mdOnBlock = true;
		}else if (mx < size/7.5 && my > size - size/10){
			callback(cw.selectedColor);
			can.removeEventListener("mousedown",mdFunc);
			document.removeEventListener("mousemove",mmFunc);
			document.removeEventListener("mouseup",muFunc);
			document.body.removeChild(can);
			document.body.removeChild(cw.text);
		}
	};
	var mmFunc = function(e){
		var mx = e.pageX - cw.x - 10,my = e.pageY - cw.y - 10;
		if (cw.mdOnSideBar){
			//On base color selector/sidebar
			var p = my / size;
			p = (p>=1)?.99:((p<0)?0:p);
			cw.baseColor = cw.getBaseColor(p);
			cw.baseColorRed = (cw.baseColor & 0xFF0000)>>16;
			cw.baseColorGreen = (cw.baseColor & 0x00FF00)>>8;
			cw.baseColorBlue = cw.baseColor & 0x0000FF;
			var px = cw.selectedColorX,py = cw.selectedColorY;
			cw.selectedColor = cw.getColorAt(px,py);
			cw.rendercolorSelector();
		}else if (cw.mdOnBlock){
			//on block color selecter
			var sz = size - size/7.5;
			var px = mx/sz;
			var py = my/sz;
			cw.selectedColorX = (px<=1)?((px>=0)?px:0):1;
			cw.selectedColorY = (py<=1)?((py>=0)?py:0):1;
			cw.selectedColor = cw.getColorAt(cw.selectedColorX,cw.selectedColorY);
			cw.rendercolorSelector();
		}
	};
	var muFunc = function(e){
		cw.mdOnBlock = false;
		cw.mdOnSideBar = false;
	};
	can.addEventListener("mousedown",mdFunc);
	//The scope of the next function is document, this way the user
	//will be able to release the mouse outside the canvas and still
	//have it register
	document.addEventListener("mousemove",mmFunc);
	document.addEventListener("mouseup",muFunc);
};
colorSelector.prototype.rendercolorSelector = function(){
	//Sidebar render
	var hex = function(x){
		var str = x.toString(16);
		while(str.length<6){
			str = "0" + str;
		}
		return str;
	}
	var size = this.size,con=this.con,cfuncs = this.cfuncs;
	con.fillStyle = "#fff";
	con.fillRect(0,0,size,size);
	for (var i = 0;i<1;i+=1/size){
		var color = this.getBaseColor(i);
		con.fillStyle = "#" + hex(Math.round(color));
		con.fillRect(size - size/10,size*i,size/10,1);
	}
	var sz = size - size/7.5;
	var imgd = con.getImageData(0,0,sz,sz);
	var dat =  imgd.data;
	var r=this.baseColorRed,g=this.baseColorGreen,b=this.baseColorBlue;
	var i = 0;
	for (var iy = 0;iy<sz;iy++){
		var py = iy/sz;
		for (var ix = 0;ix<sz;ix++){
			var px = ix/sz;
			dat[i] = (r+(0xFF-r)*py)*px;
			dat[i+1] = (g+(0xFF-g)*py)*px;
			dat[i+2] = (b+(0xFF-b)*py)*px;
			dat[i+3] = 255;
			i+=4;
		}
	}
	con.putImageData(imgd,0,0);
	
	//Draw the inverted circle
	var ic = this.getColorAt(this.selectedColorX,this.selectedColorY);
	var ir = 255 - ((ic & 0xFF0000)>>16);
	var ig = 255 - ((ic & 0x00FF00)>>8);
	var ib = 255 - (ic & 0x0000FF);
	ic = (ir<<16)|(ig<<8)|ib;
	con.strokeStyle = "#" + hex(ic);
	con.lineWidth = size*.01;

	con.beginPath();
	con.arc(this.selectedColorX*sz,this.selectedColorY*sz,size*.05,0,Math.PI*2,true);
	con.closePath();
	con.stroke();
	con.strokeStyle="";
	
	con.fillStyle = "#" + hex(this.selectedColor);
	con.fillRect(0,size-size/10,size/7.5,size/10);
	
	this.text.value = (hex(this.selectedColor));
};
colorSelector.prototype.getColorAt = function(px,py){
	var r=this.baseColorRed,g=this.baseColorGreen,b=this.baseColorBlue;
	return (((r+(0xFF - r)*py)*px)<<16)|(((g+(0xFF - g)*py)*px)<<8)|((b+(0xFF - b)*py)*px);
};
colorSelector.prototype.getBaseColor = function(p){
	p*=6;
	switch(Math.floor(p)){
		case 0:
			return 0xFF0000 + 0x0000FF * (p%1);
		break;
		case 1:
			return 0xFF00FF - (Math.floor((p%1) * 0xFF) << 16);
		break;
		case 2:
			return 0x0000FF + (Math.floor((p%1)*0xFF) << 8);
		break;
		case 3:
			return 0x00FFFF - Math.floor((p%1)*0xFF);
		break;
		case 4:
			return 0x00FF00 + (Math.floor((p%1)*0xFF) << 16);
		break;
		case 5:
			return 0xFFFF00 - (Math.floor((p%1)*0xFF) << 8);
		break;
	}
};
