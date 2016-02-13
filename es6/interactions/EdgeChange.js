"use strict";

load.provide("mm.interactions.EdgeChange", (function() {
	let Interaction = load.require("mm.interactions.Interaction");
	
	return class EdgeChange extends Interaction {
		constructor(interactor, abstractGraph, editor) {
			super(interactor, abstractGraph, editor);
			
			this._vertexChangeEvent = null;
			this._vertexRetargetEvent = null;
			this._vertexRehostEvent = null;
		}
		
		async addEdge(renderer, joint, edge) {
			Interaction.prototype.addEdge.call(this, renderer, joint, edge);
			
			let svgEdge = renderer.getSvgEdge(edge.id);
			
			$(svgEdge).on("mousedown", (e) => {
				console.log(e.target);
				if(!Array.prototype.includes.call(e.target.classList, "marker-vertex")
				&& !Array.prototype.includes.call(e.target.classList, "marker-arrowhead")
				) {
					e.stopPropagation();
				}
			});
			
			joint.on("change:vertices", (e, o) => {
				this._vertexChangeEvent = [edge, e];
				
			});
			
			joint.on("change:source", (e, o) => {
				this._vertexRehostEvent = [edge, e, o, joint];
			});
			
			joint.on("change:target", (e, o) => {
				this._vertexRetargetEvent = [edge, e, o, joint];
			});
		}
		
		async addCanvas(renderer, node) {
			$(node).on("mouseup", (e) => {
				// This doesn't handle mouse going out of widget
				if(this._vertexChangeEvent) {
					let [edge, e] = this._vertexChangeEvent;
					let oldVerts = edge.points;
					
					edge.changePoints(e.attributes.vertices.map(x => [x.x, x.y]));
					
					if(this._editor) this._editor.addToUndoStack("edge_change", {id:edge.id, old:oldVerts, "new":edge.points});
					
					this._vertexChangeEvent = null;
				}
				
				if(this._vertexRetargetEvent) {
					let [edge, e, o, joint] = this._vertexRetargetEvent;
					this._vertexRetargetEvent = null;
					
					if(!("id" in o)) return;
					
					let newTarget = renderer.getNodeFromJoint(o.id);
					
					if(edge.dest != newTarget) {
						this._editor.addToUndoStack("edge_retarget", {id:edge.id, old:edge.dest, "new":newTarget});
						edge.dest = newTarget;
						this._interactor.rerender();
					}
				}
				
				if(this._vertexRehostEvent) {
					let [edge, e, o, joint] = this._vertexRehostEvent;
					this._vertexRehostEvent = null;
					
					if(!("id" in o)) return;
					
					let newHost = renderer.getNodeFromJoint(o.id);
					
					if(edge.origin != newHost) {
						this._editor.addToUndoStack("edge_rehost", {id:edge.id, old:edge.origin, "new":newHost});
						edge.origin = newHost;
						this._interactor.rerender();
					}
				}
			});
		}
	};
})());