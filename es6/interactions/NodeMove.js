"use strict";

load.provide("mm.interactions.NodeMove", (function() {
	let Interaction = load.require("mm.interactions.Interaction");
	let Editor = load.require("mm.Editor");
	
	Editor.registerUndo("node_move", function(type, arg, graph) {
		graph.objects.getNode(arg.id).update({x: arg.old[0], y: arg.old[1]});
	}, function(type, arg, graph) {
		graph.objects.getNode(arg.id).update({x: arg["new"][0], y: arg["new"][1]});
	});
	
	Editor.registerUndo("node_multimove", function(type, arg, graph) {
		for(let n of arg.nodes) graph.objects.getNode(n.id).update({x:n.old[0], y:n.old[1]});
		for(let e of arg.edges) graph.objects.getEdge(e.id).points = e.old;
	}, function(type, arg, graph) {
		for(let n of arg.nodes) graph.objects.getNode(n.id).update({x:n["new"][0], y:n["new"][1]});
		for(let e of arg.edges) graph.objects.getEdge(e.id).points = e["new"];
	});
	
	return class NodeMove extends Interaction {
		constructor(interactor, abstractGraph, editor, state) {
			super(interactor, abstractGraph, editor, state);
			
			this._moves = new Map();
		}
		
		async addNode(renderer, joint, node) {
			Interaction.prototype.addNode.call(this, renderer, joint, node);
			
			let svgNode = renderer.getSvgNode(node.id);
			
			if(this._editor) $(svgNode).on("mousedown", (e) => {
				if(e.target.tagName == "circle") return;
				
				this._moves.set(renderer, node);
			});
		}
		
		async addCanvas(renderer, html) {
			let [cx, cy] = [0, 0];
			
			if(this._editor) $(html).on("mousedown", (e) => {
				[cx, cy] = [e.clientX, e.clientY]
			});
			
			if(this._editor) $(html).on("mousemove", (e) => {
				if(this._moves.has(renderer) && this._moves.get(renderer)) {
					let multiSel = this._state.getMultiSel();
					let moving = this._moves.get(renderer);
					
					if(this._state.inMultiSel(moving)) {
						let [deltaX, deltaY] = [e.clientX -cx, e.clientY - cy];
						[cx, cy] = [e.clientX, e.clientY];
						
						for(let n of multiSel) {
							if(n == moving) continue;
							
							let sn = this._nodes.get(n.id)[1];
							sn.translate(deltaX, deltaY);
						}
						
						let edges = this._abstractGraph.connectedEdges(multiSel);
						for(let ed of edges) {
							let je = this._edges.get(ed.id)[1];
							
							je.set("vertices", je.get("vertices").map(function(o) {return {
								x:o.x + deltaX,
								y:o.y + deltaY
							}}.bind(this)));
						}
					}
				}
			});
			
			let _stopMove = (e) => {
				// The changed position seems to be in joint.changed.position. Not sure if I'm supposed to use it, but
				// it's public.
				let movedNode = this._moves.get(renderer);
				if(!movedNode) return;
				
				let movedNodeJoint = this._nodes.get(movedNode.id)[1];
				
				let newPos = movedNodeJoint.get("position");
				let [npx, npy] = [newPos.x / renderer.getScale(), newPos.y / renderer.getScale()];
				
				if(movedNode.x != npx || movedNode.y != npy) {
					// Node has been moved
					if(this._state.inMultiSel(movedNode)) {
						let multiSel = this._state.getMultiSel();
						
						let arg = {nodes:[], edges:[]};
						
						for(let n of multiSel) {
							let oldPos = [n.x, n.y];
							
							let newPos = this._nodes.get(n.id)[1].get("position");
							newPos.x /= renderer.getScale();
							newPos.y /= renderer.getScale();
							
							n.changePosition(newPos.x, newPos.y);
							
							arg.nodes.push({id:n.id, old:[oldPos[0], oldPos[1]], "new":[newPos.x, newPos.y]});
						}
						
						let edges = this._abstractGraph.connectedEdges(multiSel);
						for(let ed of edges) {
							let je = this._edges.get(ed.id)[1];
							
							arg.edges.push({id:ed.id, "new":je.get("vertices").map(
								(o) => [o.x / renderer.getScale(), o.y / renderer.getScale()]
							), old:ed.points});
						}
						
						this._editor.addToUndoStack("node_multimove", arg);
					}else{
						let oldPos = [movedNode.x, movedNode.y];
					
						movedNode.changePosition(npx, npy);
					
						this._editor.addToUndoStack("node_move", {id:movedNode.id, old:oldPos, "new":[movedNode.x, movedNode.y]});
					}
				}
				
				this._moves.set(renderer, null);
			};
			
			if(this._editor) $(html).on("mouseup", _stopMove);
			if(this._editor) $(html).mouseleave(_stopMove);
		}
	};
}));
